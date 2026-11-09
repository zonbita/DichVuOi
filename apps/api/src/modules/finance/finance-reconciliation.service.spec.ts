import { PaymentStatus } from '../../database/prisma/client';
import type { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceReconciliationService } from './finance-reconciliation.service';

type Tx = {
  userId: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
  id: string;
  reference: string;
};

function makePrisma(opts: {
  users: { id: string; email: string; walletBalance: number }[];
  txs: Tx[];
  held?: { id: string; totalPrice: number }[];
}) {
  const latestPerUser = () => {
    const byUser = new Map<string, Tx>();
    for (const t of opts.txs) {
      const cur = byUser.get(t.userId);
      if (!cur || t.createdAt > cur.createdAt) byUser.set(t.userId, t);
    }
    return [...byUser.values()].map((t) => ({
      userId: t.userId,
      balanceAfter: t.balanceAfter,
    }));
  };
  const prisma = {
    user: { findMany: jest.fn(async () => opts.users) },
    booking: {
      findMany: jest.fn(async (args: { where: { paymentStatus: string } }) => {
        expect(args.where.paymentStatus).toBe(PaymentStatus.HELD);
        return opts.held ?? [];
      }),
    },
    walletTransaction: {
      groupBy: jest.fn(async () => {
        const sums = new Map<string, number>();
        for (const t of opts.txs) {
          sums.set(t.userId, (sums.get(t.userId) ?? 0) + t.amount);
        }
        return [...sums].map(([userId, amount]) => ({
          userId,
          _sum: { amount },
        }));
      }),
      findMany: jest.fn(async (args: any) => {
        if (args.distinct) return latestPerUser();
        const wanted = new Set<string>(args.where.reference.in);
        return opts.txs
          .filter((t) => wanted.has(t.reference))
          .map((t) => ({ reference: t.reference }));
      }),
    },
  };
  return prisma as unknown as PrismaService;
}

let seq = 0;
function tx(
  userId: string,
  amount: number,
  balanceAfter: number,
  reference?: string,
): Tx {
  seq += 1;
  return {
    userId,
    amount,
    balanceAfter,
    reference: reference ?? `ref-${seq}`,
    id: `t${seq}`,
    createdAt: new Date(2026, 0, 1, 0, 0, seq),
  };
}

describe('FinanceReconciliationService', () => {
  it('reports ok when every wallet matches its ledger and escrow is consistent', async () => {
    const svc = new FinanceReconciliationService(
      makePrisma({
        users: [
          { id: 'c', email: 'c@x', walletBalance: 600_000 },
          { id: 'p', email: 'p@x', walletBalance: 0 },
        ],
        txs: [
          tx('c', 1_000_000, 1_000_000),
          tx('c', -400_000, 600_000, 'hold:b1'),
        ],
        held: [{ id: 'b1', totalPrice: 400_000 }],
      }),
    );
    const report = await svc.reconcile();
    expect(report.ok).toBe(true);
    expect(report.usersChecked).toBe(2);
    expect(report.totals).toEqual({
      walletBalance: 600_000,
      ledgerSum: 600_000,
      heldEscrow: 400_000,
    });
  });

  it('flags a wallet whose balance drifted from the ledger, largest drift first', async () => {
    const svc = new FinanceReconciliationService(
      makePrisma({
        users: [
          { id: 'a', email: 'a@x', walletBalance: 1_050 },
          { id: 'b', email: 'b@x', walletBalance: 500_000 },
        ],
        txs: [tx('a', 1_000, 1_000), tx('b', 200_000, 200_000)],
      }),
    );
    const report = await svc.reconcile();
    expect(report.ok).toBe(false);
    expect(report.walletMismatches.map((m) => [m.userId, m.drift])).toEqual([
      ['b', 300_000],
      ['a', 50],
    ]);
    expect(report.walletMismatches[1]).toMatchObject({
      ledgerSum: 1_000,
      lastBalanceAfter: 1_000,
    });
  });

  it('flags a wallet whose last balanceAfter disagrees even if the sum matches', async () => {
    const svc = new FinanceReconciliationService(
      makePrisma({
        users: [{ id: 'a', email: 'a@x', walletBalance: 300 }],
        txs: [tx('a', 100, 100), tx('a', 200, 999)],
      }),
    );
    const report = await svc.reconcile();
    expect(report.walletMismatches).toEqual([
      expect.objectContaining({ userId: 'a', drift: 0, lastBalanceAfter: 999 }),
    ]);
  });

  it('flags a non-zero wallet that has no ledger entries at all', async () => {
    const svc = new FinanceReconciliationService(
      makePrisma({
        users: [{ id: 'seeded', email: 's@x', walletBalance: 5_000 }],
        txs: [],
      }),
    );
    const report = await svc.reconcile();
    expect(report.walletMismatches).toEqual([
      expect.objectContaining({
        userId: 'seeded',
        ledgerSum: 0,
        lastBalanceAfter: null,
        drift: 5_000,
      }),
    ]);
  });

  it('flags held bookings with a missing hold entry or an existing payout/refund', async () => {
    const svc = new FinanceReconciliationService(
      makePrisma({
        users: [],
        txs: [
          tx('c', -100, 0, 'hold:ok'),
          tx('c', -200, 0, 'hold:paid'),
          tx('p', 170, 170, 'payout:paid'),
        ],
        held: [
          { id: 'ok', totalPrice: 100 },
          { id: 'paid', totalPrice: 200 },
          { id: 'nohold', totalPrice: 300 },
        ],
      }),
    );
    const report = await svc.reconcile();
    expect(report.heldBookingsChecked).toBe(3);
    expect(report.escrowMismatches).toEqual([
      {
        bookingId: 'paid',
        totalPrice: 200,
        problem: 'already_settled_in_ledger',
      },
      { bookingId: 'nohold', totalPrice: 300, problem: 'missing_hold_entry' },
    ]);
  });
});
