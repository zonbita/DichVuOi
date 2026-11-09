import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../database/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

export type WalletMismatch = {
  userId: string;
  email: string;
  walletBalance: number;
  /** Tổng `amount` của mọi bút toán (dương = vào, âm = ra). */
  ledgerSum: number;
  /** `balanceAfter` của bút toán mới nhất; null nếu user chưa có bút toán. */
  lastBalanceAfter: number | null;
  /** walletBalance − ledgerSum. Dương: ví nhiều hơn sổ cái. */
  drift: number;
};

export type EscrowMismatch = {
  bookingId: string;
  totalPrice: number;
  problem: 'missing_hold_entry' | 'already_settled_in_ledger';
};

export type ReconciliationReport = {
  checkedAt: string;
  usersChecked: number;
  heldBookingsChecked: number;
  ok: boolean;
  totals: {
    walletBalance: number;
    ledgerSum: number;
    heldEscrow: number;
  };
  walletMismatches: WalletMismatch[];
  escrowMismatches: EscrowMismatch[];
};

/**
 * Đối soát chỉ đọc giữa số dư lưu sẵn và sổ cái:
 *
 * 1. Ví: với mỗi user, `walletBalance` phải bằng tổng `WalletTransaction.amount`
 *    và bằng `balanceAfter` của bút toán mới nhất.
 * 2. Escrow: mỗi đơn đang `HELD` phải có bút toán giữ cọc (`hold:<id>`) và
 *    chưa có bút toán giải ngân/hoàn (`payout:` / `refund:`).
 *
 * Không sửa dữ liệu — chỉ báo cáo để admin xử lý.
 */
@Injectable()
export class FinanceReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async reconcile(): Promise<ReconciliationReport> {
    const [walletMismatches, wallet] = await this.reconcileWallets();
    const [escrowMismatches, escrow] = await this.reconcileEscrow();
    return {
      checkedAt: new Date().toISOString(),
      usersChecked: wallet.usersChecked,
      heldBookingsChecked: escrow.heldBookingsChecked,
      ok: walletMismatches.length === 0 && escrowMismatches.length === 0,
      totals: {
        walletBalance: wallet.walletBalance,
        ledgerSum: wallet.ledgerSum,
        heldEscrow: escrow.heldEscrow,
      },
      walletMismatches,
      escrowMismatches,
    };
  }

  private async reconcileWallets() {
    const [users, sums, latest] = await Promise.all([
      this.prisma.user.findMany({
        select: { id: true, email: true, walletBalance: true },
      }),
      this.prisma.walletTransaction.groupBy({
        by: ['userId'],
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.findMany({
        distinct: ['userId'],
        orderBy: [{ userId: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: { userId: true, balanceAfter: true },
      }),
    ]);

    const sumByUser = new Map(sums.map((s) => [s.userId, s._sum.amount ?? 0]));
    const lastByUser = new Map(latest.map((t) => [t.userId, t.balanceAfter]));

    const mismatches: WalletMismatch[] = [];
    let walletBalance = 0;
    let ledgerSum = 0;
    for (const user of users) {
      const sum = sumByUser.get(user.id) ?? 0;
      const last = lastByUser.get(user.id) ?? null;
      walletBalance += user.walletBalance;
      ledgerSum += sum;
      const lastMatches = last === null || last === user.walletBalance;
      if (user.walletBalance !== sum || !lastMatches) {
        mismatches.push({
          userId: user.id,
          email: user.email,
          walletBalance: user.walletBalance,
          ledgerSum: sum,
          lastBalanceAfter: last,
          drift: user.walletBalance - sum,
        });
      }
    }
    mismatches.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));
    return [
      mismatches,
      { usersChecked: users.length, walletBalance, ledgerSum },
    ] as const;
  }

  private async reconcileEscrow() {
    const held = await this.prisma.booking.findMany({
      where: { paymentStatus: PaymentStatus.HELD },
      select: { id: true, totalPrice: true },
    });
    const ids = held.map((b) => b.id);
    const refs = ids.length
      ? await this.prisma.walletTransaction.findMany({
          where: {
            reference: {
              in: ids.flatMap((id) => [
                `hold:${id}`,
                `payout:${id}`,
                `refund:${id}`,
              ]),
            },
          },
          select: { reference: true },
        })
      : [];
    const present = new Set(refs.map((r) => r.reference));

    const mismatches: EscrowMismatch[] = [];
    let heldEscrow = 0;
    for (const booking of held) {
      heldEscrow += booking.totalPrice;
      if (!present.has(`hold:${booking.id}`)) {
        mismatches.push({
          bookingId: booking.id,
          totalPrice: booking.totalPrice,
          problem: 'missing_hold_entry',
        });
      } else if (
        present.has(`payout:${booking.id}`) ||
        present.has(`refund:${booking.id}`)
      ) {
        mismatches.push({
          bookingId: booking.id,
          totalPrice: booking.totalPrice,
          problem: 'already_settled_in_ledger',
        });
      }
    }
    return [
      mismatches,
      { heldBookingsChecked: held.length, heldEscrow },
    ] as const;
  }
}
