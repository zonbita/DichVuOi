import { env } from '../../config/env';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WalletTransactionType } from '../../database/prisma/client';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { resolveVietQrIntentSecret } from '../../common/security-env';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PayosService } from './payos.service';
import type { PayosWebhookPayload } from './payos.service';
import {
  assertMockPaymentsAllowed,
  type VietQrIntentPayload,
} from './finance.shared';

/** Nạp ví qua VietQR / payOS: intent ký HMAC, webhook, xác nhận mock. */
@Injectable()
export class FinanceTopUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payos: PayosService,
  ) {}

  private readonly vietQrBankId = env.vietQrBankId ?? '970422';
  private readonly vietQrAccountNo = env.vietQrAccountNo;
  private readonly vietQrAccountName = env.vietQrAccountName;
  private readonly vietQrIntentSecret = resolveVietQrIntentSecret();
  private readonly vietQrIntentTtlMs = 15 * 60_000;

  async createVietQrIntent(userId: string, amount: number) {
    const expiresAt = new Date(Date.now() + this.vietQrIntentTtlMs);
    const nonce = randomUUID().slice(0, 8);
    const payosReady = this.payos.isConfigured();
    const orderCode = payosReady
      ? randomInt(1_000_000, 2_000_000_000)
      : undefined;
    const intentId = this.signVietQrIntent({
      u: userId,
      a: amount,
      e: expiresAt.getTime(),
      n: nonce,
      ...(orderCode ? { o: orderCode } : {}),
    });
    const fallbackNote = `DVO ${intentId.slice(0, 18)}`;

    if (payosReady && orderCode) {
      try {
        const description = 'NAPVI';
        const link = await this.payos.createPaymentLink({
          orderCode,
          amount,
          description,
          expiredAt: expiresAt,
        });
        await this.prisma.walletTopUpIntent.create({
          data: {
            userId,
            amount,
            orderCode,
            intentToken: intentId,
            paymentLinkId: link.paymentLinkId,
            provider: 'payos',
            transferNote: link.description || description,
            expiresAt,
          },
        });
        return {
          intentId,
          amount,
          currency: 'VND',
          bankId: link.bin || this.vietQrBankId,
          accountNo: link.accountNumber || this.vietQrAccountNo,
          accountName: link.accountName || this.vietQrAccountName,
          transferNote: link.description || description,
          qrImageUrl: this.vietQrImageUrl(
            amount,
            link.description || description,
            link.bin || this.vietQrBankId,
            link.accountNumber || this.vietQrAccountNo,
            link.accountName || this.vietQrAccountName,
          ),
          checkoutUrl: link.checkoutUrl || null,
          provider: 'payos' as const,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (err) {
        console.warn(
          `[payos] create payment failed, fallback VietQR: ${(err as Error).message}`,
        );
      }
    }

    return {
      intentId,
      amount,
      currency: 'VND',
      bankId: this.vietQrBankId,
      accountNo: this.vietQrAccountNo,
      accountName: this.vietQrAccountName,
      transferNote: fallbackNote,
      qrImageUrl: this.vietQrImageUrl(amount, fallbackNote),
      checkoutUrl: null,
      provider: 'vietqr' as const,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getVietQrIntentStatus(userId: string, intentId: string) {
    const payload = this.verifyVietQrIntent(intentId);
    if (payload.u !== userId) {
      throw new ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
    }
    const paidTx = await this.findPaidTopUp(intentId, payload.o);
    if (!paidTx && payload.o && this.payos.isConfigured()) {
      await this.syncPayosPayment(payload.o);
    }
    const latest = paidTx ?? (await this.findPaidTopUp(intentId, payload.o));
    return {
      intentId,
      amount: payload.a,
      status: latest ? 'PAID' : 'PENDING',
      paidAt: latest?.createdAt.toISOString() ?? null,
      expiresAt: new Date(payload.e).toISOString(),
      provider: payload.o ? 'payos' : 'vietqr',
    };
  }

  /** Webhook payOS — xác minh chữ ký rồi cộng ví (idempotent). */
  async handlePayosWebhook(payload: PayosWebhookPayload) {
    const verified = this.payos.verifyWebhook(payload);
    if (!verified) {
      return { ok: false, reason: 'invalid_signature' };
    }
    const paidCode = verified.code ?? payload.code;
    if (paidCode && paidCode !== '00') {
      return { ok: true, ignored: true };
    }
    const credited = await this.syncPayosPayment(
      verified.orderCode,
      verified.amount,
    );
    return { ok: true, credited };
  }

  /** Local/dev mock: xác nhận đã chuyển khoản VietQR rồi cộng ví (idempotent). */
  async confirmVietQrIntentMock(userId: string, intentId: string) {
    assertMockPaymentsAllowed();
    const payload = this.verifyVietQrIntent(intentId);
    if (payload.u !== userId) {
      throw new ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
    }
    if (payload.e < Date.now()) {
      throw new BadRequestException('Mã VietQR đã hết hạn');
    }

    return this.prisma.$transaction(async (tx) => {
      const reference = `vietqr:paid:${intentId}`;
      const existing = await tx.walletTransaction.findUnique({
        where: { reference },
      });
      if (existing) {
        const current = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: { walletBalance: true },
        });
        return { currency: 'VND', balance: current.walletBalance, amount: 0 };
      }

      const user = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: payload.a } },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.TOP_UP,
          amount: payload.a,
          balanceAfter: user.walletBalance,
          description: 'Nạp VNĐ qua VietQR (mock xác nhận)',
          reference,
        },
      });
      await tx.walletTopUpIntent.updateMany({
        where: { intentToken: intentId, paidAt: null },
        data: { paidAt: new Date() },
      });
      return {
        currency: 'VND',
        balance: user.walletBalance,
        amount: payload.a,
      };
    });
  }

  private vietQrImageUrl(
    amount: number,
    transferNote: string,
    bankId = this.vietQrBankId,
    accountNo = this.vietQrAccountNo,
    accountName = this.vietQrAccountName,
  ) {
    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: transferNote,
      accountName,
    });
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params.toString()}`;
  }

  private paidReferences(intentId: string, orderCode?: number) {
    const refs = [`vietqr:paid:${intentId}`];
    if (orderCode) refs.push(`payos:paid:${orderCode}`);
    return refs;
  }

  private async findPaidTopUp(intentId: string, orderCode?: number) {
    return this.prisma.walletTransaction.findFirst({
      where: { reference: { in: this.paidReferences(intentId, orderCode) } },
      select: { id: true, createdAt: true, amount: true },
    });
  }

  private async syncPayosPayment(orderCode: number, webhookAmount?: number) {
    const intent = await this.prisma.walletTopUpIntent.findUnique({
      where: { orderCode },
    });
    if (!intent) return false;
    if (intent.expiresAt.getTime() < Date.now() && !intent.paidAt) {
      return false;
    }

    let amount = webhookAmount ?? intent.amount;
    if (webhookAmount == null && this.payos.isConfigured()) {
      const remote = await this.payos.getPaymentLink(
        intent.paymentLinkId || orderCode,
      );
      if (!remote || remote.status !== 'PAID') return false;
      amount = remote.amount || intent.amount;
    }
    if (amount !== intent.amount) {
      return false;
    }

    const reference = `payos:paid:${orderCode}`;
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findFirst({
        where: {
          reference: {
            in: this.paidReferences(intent.intentToken, orderCode),
          },
        },
      });
      if (existing) {
        if (!intent.paidAt) {
          await tx.walletTopUpIntent.update({
            where: { id: intent.id },
            data: { paidAt: existing.createdAt },
          });
        }
        return;
      }
      const user = await tx.user.update({
        where: { id: intent.userId },
        data: { walletBalance: { increment: amount } },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId: intent.userId,
          type: WalletTransactionType.TOP_UP,
          amount,
          balanceAfter: user.walletBalance,
          description: 'Nạp VNĐ qua VietQR (payOS xác minh)',
          reference,
        },
      });
      await tx.walletTopUpIntent.update({
        where: { id: intent.id },
        data: { paidAt: new Date() },
      });
    });
    return true;
  }

  private signVietQrIntent(payload: VietQrIntentPayload) {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json, 'utf8').toString('base64url');
    const sig = createHmac('sha256', this.vietQrIntentSecret)
      .update(data)
      .digest('base64url');
    return `${data}.${sig}`;
  }

  private verifyVietQrIntent(intentId: string): VietQrIntentPayload {
    const [data, sig] = intentId.split('.');
    if (!data || !sig) {
      throw new BadRequestException('Mã VietQR không hợp lệ');
    }
    const expect = createHmac('sha256', this.vietQrIntentSecret)
      .update(data)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectBuf = Buffer.from(expect);
    if (
      sigBuf.length !== expectBuf.length ||
      !timingSafeEqual(sigBuf, expectBuf)
    ) {
      throw new BadRequestException('Mã VietQR sai chữ ký');
    }
    const payload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8'),
    ) as VietQrIntentPayload;
    if (!payload?.u || !payload?.a || !payload?.e) {
      throw new BadRequestException('Mã VietQR không hợp lệ');
    }
    return payload;
  }
}
