import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import {
  AdminFinanceTxQueryDto,
  AdminFinanceWalletQueryDto,
  AdminAdjustWalletDto,
} from './dto';
import { paginated, resolvePage } from './admin-pagination';

/** Finance overview, wallets, ledger, manual wallet adjustment (delegates to FinanceService). */
@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finance: FinanceService,
  ) {}

  async financeOverview() {
    const [
      walletAgg,
      walletsPositive,
      held,
      escrowAgg,
      commissionAgg,
      withdrawSum,
      recentTx,
    ] = await Promise.all([
      this.prisma.user.aggregate({ _sum: { walletBalance: true } }),
      this.prisma.user.count({ where: { walletBalance: { gt: 0 } } }),
      this.prisma.booking.count({
        where: { paymentStatus: PaymentStatus.HELD },
      }),
      this.prisma.booking.aggregate({
        where: { paymentStatus: PaymentStatus.HELD },
        _sum: { totalPrice: true },
      }),
      this.prisma.booking.aggregate({
        where: { paymentStatus: PaymentStatus.RELEASED },
        _sum: { commissionAmount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: WalletTransactionType.WITHDRAW },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: { id: true, service: { select: { name: true } } },
          },
        },
      }),
    ]);

    return {
      currency: 'VND',
      totalWalletBalance: walletAgg._sum.walletBalance ?? 0,
      walletsWithBalance: walletsPositive,
      escrowHeldCount: held,
      escrowHeldAmount: escrowAgg._sum.totalPrice ?? 0,
      commissionEarned: commissionAgg._sum.commissionAmount ?? 0,
      /** amount rút đã âm trên sổ → hiển thị abs. */
      withdrawnTotal: Math.abs(withdrawSum._sum.amount ?? 0),
      recentTransactions: recentTx,
    };
  }

  async listFinanceWallets(query: AdminFinanceWalletQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query.positiveOnly ? { walletBalance: { gt: 0 } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
              { id: { contains: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { walletBalance: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          walletBalance: true,
          bankName: true,
          bankAccountNo: true,
          bankAccountName: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async listFinanceTransactions(query: AdminFinanceTxQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();
    const type = query.type?.trim() as WalletTransactionType | undefined;
    const validType =
      type && Object.values(WalletTransactionType).includes(type)
        ? type
        : undefined;

    const where: Prisma.WalletTransactionWhereInput = {
      ...(validType ? { type: validType } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(q
        ? {
            OR: [
              { description: { contains: q } },
              { reference: { contains: q } },
              { user: { fullName: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: { id: true, service: { select: { name: true } } },
          },
        },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async adjustWallet(userId: string, dto: AdminAdjustWalletDto) {
    return this.finance.adminAdjustBalance(userId, dto.amount, dto.reason);
  }
}
