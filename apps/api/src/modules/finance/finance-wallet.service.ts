import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WalletTransactionType } from '../../database/prisma/client';
import { randomInt, randomUUID } from 'crypto';
import { allowMockPayments } from '../../common/security-env';
import { takeEmailOtpSlot } from '../../common/email-otp-rate';
import { assertUserNotBlocked } from '../../common/assert-not-blocked';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PayosService } from './payos.service';
import {
  assertMockPaymentsAllowed,
  BANK_VERIFY_OTP_TTL_MS,
} from './finance.shared';

/** Ví: số dư, rút tiền, xác minh STK, nạp mock, admin điều chỉnh. */
@Injectable()
export class FinanceWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly payos: PayosService,
  ) {}

  private vietQrBanksCache: {
    at: number;
    banks: Array<{
      id: number;
      name: string;
      code: string;
      bin: string;
      shortName: string;
      logo: string;
      transferSupported: number;
    }>;
  } | null = null;

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletBalance: true,
        emailVerified: true,
        bankVerified: true,
        bankBin: true,
        bankCode: true,
        bankName: true,
        bankAccountNo: true,
        bankAccountName: true,
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            booking: {
              select: {
                id: true,
                service: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return {
      currency: 'VND',
      balance: user.walletBalance,
      mockPaymentsEnabled: allowMockPayments(),
      payosEnabled: this.payos.isConfigured(),
      emailVerified: user.emailVerified,
      bankVerified: user.bankVerified,
      /** Rút tiền bắt buộc emailVerified (phòng rút sai NH). */
      canWithdraw: user.emailVerified,
      payout: {
        bankBin: user.bankBin,
        bankCode: user.bankCode,
        bankName: user.bankName,
        accountNo: user.bankAccountNo,
        accountName: user.bankAccountName,
      },
      transactions: user.walletTransactions,
    };
  }

  /** Danh sách ngân hàng VietQR (cache 24h). */
  async listVietQrBanks() {
    const ttlMs = 24 * 60 * 60_000;
    if (
      this.vietQrBanksCache &&
      Date.now() - this.vietQrBanksCache.at < ttlMs
    ) {
      return this.vietQrBanksCache.banks;
    }

    try {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      const json = (await res.json()) as {
        code?: string;
        data?: Array<{
          id: number;
          name: string;
          code: string;
          bin: string;
          shortName: string;
          logo: string;
          transferSupported?: number;
        }>;
      };
      if (json.code !== '00' || !Array.isArray(json.data)) {
        throw new Error(json.code ?? 'vietqr_banks_failed');
      }
      const banks = json.data.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        bin: b.bin,
        shortName: b.shortName,
        logo: b.logo,
        transferSupported: b.transferSupported ?? 0,
      }));
      this.vietQrBanksCache = { at: Date.now(), banks };
      return banks;
    } catch (err) {
      if (this.vietQrBanksCache?.banks.length) {
        return this.vietQrBanksCache.banks;
      }
      throw new BadRequestException(
        `Không tải được danh sách ngân hàng VietQR: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Rút ví về STK user (mock trừ ví ngay — production nối payout gateway sau).
   * Bắt buộc emailVerified (OTP Gmail / Google) — phòng rút nhầm tài khoản.
   * Nếu đã bankVerified: STK phải khớp tài khoản đã liên kết.
   */
  async withdraw(
    userId: string,
    dto: {
      amount: number;
      bankBin: string;
      bankCode?: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    },
  ) {
    await assertUserNotBlocked(this.prisma, userId);
    const accountNo = dto.accountNo.replace(/\s|-/g, '').trim();
    const accountName = dto.accountName.trim().toUpperCase();
    const bankBin = dto.bankBin.trim();
    const bankName = dto.bankName.trim();
    const bankCode = (dto.bankCode ?? '').trim() || null;

    const identity = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        bankVerified: true,
        bankBin: true,
        bankAccountNo: true,
      },
    });
    if (!identity) throw new NotFoundException('Không tìm thấy tài khoản');
    if (!identity.emailVerified) {
      throw new ForbiddenException(
        'Cần xác minh email trước khi rút tiền (phòng rút sai ngân hàng).',
      );
    }
    if (identity.bankVerified) {
      const savedNo = (identity.bankAccountNo ?? '').replace(/\s|-/g, '');
      if (savedNo && savedNo !== accountNo) {
        throw new BadRequestException(
          'STK khác tài khoản đã xác minh — xác minh lại NH hoặc dùng đúng STK đã liên kết.',
        );
      }
      if (identity.bankBin && identity.bankBin !== bankBin) {
        throw new BadRequestException(
          'Ngân hàng khác tài khoản đã xác minh — xác minh lại NH hoặc dùng đúng NH đã liên kết.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, walletBalance: { gte: dto.amount } },
        data: {
          walletBalance: { decrement: dto.amount },
          bankBin,
          bankCode,
          bankName,
          bankAccountNo: accountNo,
          bankAccountName: accountName,
        },
      });
      if (updated.count === 0) {
        const current = await tx.user.findUnique({
          where: { id: userId },
          select: { walletBalance: true },
        });
        if (!current) throw new NotFoundException('Không tìm thấy tài khoản');
        throw new BadRequestException(
          `Số dư không đủ. Khả dụng ${current.walletBalance.toLocaleString('vi-VN')} VNĐ`,
        );
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          walletBalance: true,
          bankBin: true,
          bankCode: true,
          bankName: true,
          bankAccountNo: true,
          bankAccountName: true,
        },
      });

      const reference = `withdraw:${userId}:${randomUUID()}`;
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.WITHDRAW,
          amount: -dto.amount,
          balanceAfter: user.walletBalance,
          description: `Rút về ${bankName} · ${accountNo} · ${accountName} (mock)`,
          reference,
        },
      });

      return {
        currency: 'VND',
        balance: user.walletBalance,
        amount: dto.amount,
        status: 'COMPLETED_MOCK',
        payout: {
          bankBin: user.bankBin,
          bankCode: user.bankCode,
          bankName: user.bankName,
          accountNo: user.bankAccountNo,
          accountName: user.bankAccountName,
        },
        message:
          'Đã trừ ví (mock). Production sẽ chuyển khoản thật qua cổng payout.',
      };
    });
  }

  /** Liên kết STK + gửi OTP email để xác minh trước rút. */
  async requestBankVerify(
    userId: string,
    dto: {
      bankBin: string;
      bankCode?: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const rate = takeEmailOtpSlot(user);
    const accountNo = dto.accountNo.replace(/\s|-/g, '').trim();
    const accountName = dto.accountName.trim().toUpperCase();
    const bankBin = dto.bankBin.trim();
    const bankName = dto.bankName.trim();
    const bankCode = (dto.bankCode ?? '').trim() || null;
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + BANK_VERIFY_OTP_TTL_MS);
    const mailReady = this.mail.isConfigured();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bankBin,
        bankCode,
        bankName,
        bankAccountNo: accountNo,
        bankAccountName: accountName,
        bankVerified: false,
        bankVerifyOtpCode: code,
        bankVerifyOtpExpiresAt: expiresAt,
        emailOtpSendCount: rate.emailOtpSendCount,
        emailOtpWindowStartedAt: rate.emailOtpWindowStartedAt,
      },
    });

    const sent = await this.mail.send({
      to: user.email,
      subject: 'Xác minh tài khoản ngân hàng — DichVuOi',
      text: `Ma xac minh lien ket STK ${accountNo} (${bankName}): ${code}. Het han 10 phut.`,
      html: `<p>Mã xác minh liên kết STK <strong>${accountNo}</strong> (${bankName}): <strong>${code}</strong></p><p>Hết hạn 10 phút.</p>`,
    });

    const payout = {
      bankBin,
      bankCode,
      bankName,
      accountNo,
      accountName,
    };

    if (sent.provider === 'gmail') {
      return {
        ok: true,
        channel: 'gmail' as const,
        expiresAt: expiresAt.toISOString(),
        payout,
        message: `Đã gửi mã xác minh STK tới ${user.email}`,
      };
    }

    if (mailReady) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          bankVerifyOtpCode: null,
          bankVerifyOtpExpiresAt: null,
        },
      });
      throw new BadRequestException(
        sent.mockReason ||
          'Không gửi được email. Kiểm tra Gmail App Password hoặc thử lại sau.',
      );
    }

    return {
      ok: true,
      channel: 'mock' as const,
      expiresAt: expiresAt.toISOString(),
      code,
      payout,
      message:
        sent.mockReason || 'Chưa cấu hình Gmail — dùng mã hiện trên web (dev).',
    };
  }

  async confirmBankVerify(userId: string, dto: { code: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const code = dto.code.trim();
    if (
      !user.bankVerifyOtpCode ||
      !user.bankVerifyOtpExpiresAt ||
      user.bankVerifyOtpExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Mã đã hết hạn. Gửi lại mã mới.');
    }
    if (user.bankVerifyOtpCode !== code) {
      throw new BadRequestException('Mã xác minh không đúng.');
    }
    if (!user.bankAccountNo || !user.bankBin) {
      throw new BadRequestException('Chưa có thông tin STK. Gửi lại yêu cầu.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bankVerified: true,
        bankVerifyOtpCode: null,
        bankVerifyOtpExpiresAt: null,
      },
    });
    await this.prisma.partnerProfile.updateMany({
      where: { userId },
      data: {
        bankVerified: true,
        bankName: user.bankName,
        bankAccountNo: user.bankAccountNo,
        bankAccountName: user.bankAccountName,
        bankVerifyIntentId: null,
        bankVerifyExpiresAt: null,
      },
    });

    return this.getWallet(userId);
  }

  async topUp(userId: string, amount: number) {
    assertMockPaymentsAllowed();
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.TOP_UP,
          amount,
          balanceAfter: user.walletBalance,
          description: 'Nạp VNĐ vào ví (mô phỏng)',
          reference: `topup:${userId}:${randomUUID()}`,
        },
      });
      return {
        currency: 'VND',
        balance: user.walletBalance,
      };
    });
  }

  /** Admin cộng/trừ ví (ADMIN_ADJUSTMENT). amount âm = trừ. */
  async adminAdjustBalance(userId: string, amount: number, reason: string) {
    if (!Number.isInteger(amount) || amount === 0) {
      throw new BadRequestException(
        'Số tiền điều chỉnh phải là số nguyên khác 0',
      );
    }
    const note = reason.trim();
    if (note.length < 3) {
      throw new BadRequestException('Ghi chú điều chỉnh tối thiểu 3 ký tự');
    }

    return this.prisma.$transaction(async (tx) => {
      if (amount < 0) {
        const updated = await tx.user.updateMany({
          where: { id: userId, walletBalance: { gte: -amount } },
          data: { walletBalance: { increment: amount } },
        });
        if (updated.count === 0) {
          const exists = await tx.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true },
          });
          if (!exists) throw new NotFoundException('Không tìm thấy tài khoản');
          throw new BadRequestException(
            `Số dư không đủ để trừ ${(-amount).toLocaleString('vi-VN')} VNĐ`,
          );
        }
      } else {
        const exists = await tx.user.updateMany({
          where: { id: userId },
          data: { walletBalance: { increment: amount } },
        });
        if (exists.count === 0) {
          throw new NotFoundException('Không tìm thấy tài khoản');
        }
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { walletBalance: true, fullName: true, email: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.ADMIN_ADJUSTMENT,
          amount,
          balanceAfter: user.walletBalance,
          description: `Admin điều chỉnh: ${note}`,
          reference: `admin-adj:${userId}:${randomUUID()}`,
        },
      });
      return {
        currency: 'VND',
        balance: user.walletBalance,
        amount,
        user: { id: userId, fullName: user.fullName, email: user.email },
      };
    });
  }
}
