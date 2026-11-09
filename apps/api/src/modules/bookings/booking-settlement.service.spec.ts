import { PrismaService } from '../../database/prisma/prisma.service';
import { createFakePrisma, FakePrisma } from '../../testing/fake-prisma';
import { FinanceApplyDepositService } from '../finance/finance-apply-deposit.service';
import { FinanceEscrowService } from '../finance/finance-escrow.service';
import { FinanceService } from '../finance/finance.service';
import { BookingSettlementService } from './booking-settlement.service';
import { PartnerRealtimeService } from './partner-realtime.service';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';

jest.mock('../../common/recalculate-partner-level', () => ({
  recalculatePartnerLevel: jest.fn().mockResolvedValue(null),
}));

describe('BookingSettlementService (money paths)', () => {
  let prisma: FakePrisma;
  let finance: Record<string, jest.Mock>;
  let service: BookingSettlementService;
  const user = (id: string) => prisma.user.rows.find((u) => u.id === id)!;
  const app = (id: string) =>
    prisma.bookingApplication.rows.find((a) => a.id === id)!;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createFakePrisma();
    const p = prisma as unknown as PrismaService;
    const escrow = new FinanceEscrowService(p);
    const deposits = new FinanceApplyDepositService(p);
    // Thin spies delegating to the real implementations on the fake DB.
    finance = {
      releaseBookingInTransaction: jest.fn((...a: any[]) =>
        (escrow.releaseBookingInTransaction as any)(...a),
      ),
      refundBookingInTransaction: jest.fn((...a: any[]) =>
        (escrow.refundBookingInTransaction as any)(...a),
      ),
      refundApplyDepositInTransaction: jest.fn((...a: any[]) =>
        (deposits.refundApplyDepositInTransaction as any)(...a),
      ),
      forfeitApplyDepositInTransaction: jest.fn((...a: any[]) =>
        (deposits.forfeitApplyDepositInTransaction as any)(...a),
      ),
    };
    const realtime = {
      emitOpenRemoved: jest.fn(),
      emitOpenCreated: jest.fn(),
      emitCustomerBooking: jest.fn(),
      emitPartnerBooking: jest.fn(),
    };
    service = new BookingSettlementService(
      p,
      realtime as unknown as PartnerRealtimeService,
      finance as unknown as FinanceService,
    );

    prisma.user.seed(
      { id: 'cust', walletBalance: 0 },
      { id: 'p1', walletBalance: 0 },
      { id: 'p2', walletBalance: 0 },
    );
    prisma.bookingApplication.seed(
      {
        id: 'a1',
        bookingId: 'b1',
        partnerId: 'p1',
        status: 'SELECTED',
        depositStatus: 'HELD',
        depositAmount: 100_000,
      },
      {
        id: 'a2',
        bookingId: 'b1',
        partnerId: 'p2',
        status: 'APPLIED',
        depositStatus: 'HELD',
        depositAmount: 70_000,
      },
    );
  });

  describe('refundSelectedApplyDeposit', () => {
    it('refunds the selected partner once', async () => {
      await service.refundSelectedApplyDeposit(prisma as any, 'b1', 'p1');
      await service.refundSelectedApplyDeposit(prisma as any, 'b1', 'p1');
      expect(user('p1').walletBalance).toBe(100_000);
      expect(app('a1')).toMatchObject({
        depositStatus: 'REFUNDED',
        status: 'REFUNDED',
      });
      expect(finance.refundApplyDepositInTransaction).toHaveBeenCalledTimes(1);
    });

    it('skips refund when claim loses the race (updateMany count 0)', async () => {
      // findUnique still sees HELD, but a concurrent request claimed it first
      prisma.bookingApplication.updateMany.mockResolvedValueOnce({ count: 0 });
      await service.refundSelectedApplyDeposit(prisma as any, 'b1', 'p1');
      expect(finance.refundApplyDepositInTransaction).not.toHaveBeenCalled();
      expect(user('p1').walletBalance).toBe(0);
    });

    it('no-op when application missing or not HELD', async () => {
      app('a1').depositStatus = 'RELEASED';
      await service.refundSelectedApplyDeposit(prisma as any, 'b1', 'p1');
      await service.refundSelectedApplyDeposit(prisma as any, 'b1', 'ghost');
      expect(prisma.bookingApplication.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('refundOpenApplications', () => {
    it('refunds every HELD application exactly once', async () => {
      app('a2').status = 'WITHDRAWN';
      prisma.bookingApplication.seed({
        id: 'a3',
        bookingId: 'b1',
        partnerId: 'p2',
        status: 'REJECTED',
        depositStatus: 'REFUNDED',
        depositAmount: 999,
      });
      await service.refundOpenApplications(prisma as any, 'b1');
      await service.refundOpenApplications(prisma as any, 'b1');

      expect(user('p1').walletBalance).toBe(100_000);
      expect(user('p2').walletBalance).toBe(70_000);
      expect(finance.refundApplyDepositInTransaction).toHaveBeenCalledTimes(2);
      expect(app('a1').status).toBe('REFUNDED');
      expect(app('a2')).toMatchObject({
        status: 'REJECTED',
        depositStatus: 'REFUNDED',
      });
    });

    it('skips apps whose claim returns count 0', async () => {
      // first claim (a1) lost to a concurrent request; a2 uses the real impl
      prisma.bookingApplication.updateMany.mockResolvedValueOnce({ count: 0 });
      await service.refundOpenApplications(prisma as any, 'b1');
      expect(finance.refundApplyDepositInTransaction).toHaveBeenCalledTimes(1);
      expect(finance.refundApplyDepositInTransaction).toHaveBeenCalledWith(
        prisma,
        'b1',
        'p2',
        'a2',
        70_000,
      );
    });
  });

  describe('forfeitSelectedApplyDeposit', () => {
    it('forfeits once, no wallet movement', async () => {
      await service.forfeitSelectedApplyDeposit(prisma as any, 'b1', 'p1', 'r');
      await service.forfeitSelectedApplyDeposit(prisma as any, 'b1', 'p1', 'r');
      expect(finance.forfeitApplyDepositInTransaction).toHaveBeenCalledTimes(1);
      expect(app('a1')).toMatchObject({
        depositStatus: 'RELEASED',
        status: 'REJECTED',
      });
      expect(user('p1').walletBalance).toBe(0);
      expect(prisma.walletTransaction.rows).toHaveLength(1);
    });

    it('skips when claim count is 0', async () => {
      prisma.bookingApplication.updateMany.mockResolvedValueOnce({ count: 0 });
      await service.forfeitSelectedApplyDeposit(prisma as any, 'b1', 'p1', 'r');
      expect(finance.forfeitApplyDepositInTransaction).not.toHaveBeenCalled();
    });
  });

  describe('settleExpiredConfirmations', () => {
    beforeEach(() => {
      prisma.booking.seed({
        id: 'b1',
        userId: 'cust',
        partnerId: 'p1',
        totalPrice: 1_000_000,
        commissionBps: 1500,
        status: 'AWAITING_CONFIRM',
        paymentStatus: 'HELD',
        confirmDeadlineAt: new Date(Date.now() - 1000),
      });
      prisma.invoice.seed({ bookingId: 'b1', status: 'PAID' });
    });

    it('releases payout and refunds selected deposit in one transaction', async () => {
      await service.settleExpiredConfirmations();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(user('p1').walletBalance).toBe(850_000 + 100_000);
      const relTx = finance.releaseBookingInTransaction.mock.calls[0][0];
      const refTx = finance.refundApplyDepositInTransaction.mock.calls[0][0];
      expect(relTx).toBe(refTx);
      expect(finance.releaseBookingInTransaction.mock.calls[0][2]).toEqual({
        expectedStatus: 'AWAITING_CONFIRM',
        status: 'COMPLETED',
      });
      expect(recalculatePartnerLevel).toHaveBeenCalledWith(prisma, 'p1');

      // second run: nothing expired anymore
      await service.settleExpiredConfirmations();
      expect(user('p1').walletBalance).toBe(950_000);
    });

    it('ignores bookings whose deadline has not passed', async () => {
      prisma.booking.rows[0].confirmDeadlineAt = new Date(Date.now() + 60_000);
      await service.settleExpiredConfirmations();
      expect(finance.releaseBookingInTransaction).not.toHaveBeenCalled();
    });

    it('propagates deposit-refund failure out of the transaction (rollback)', async () => {
      finance.refundApplyDepositInTransaction.mockRejectedValueOnce(
        new Error('ledger down'),
      );
      const txSeen: unknown[] = [];
      prisma.$transaction.mockImplementationOnce(async (cb: any) => {
        const tx = { ...prisma, marker: 'tx' };
        txSeen.push(tx);
        return cb(tx);
      });

      await expect(service.settleExpiredConfirmations()).rejects.toThrow(
        'ledger down',
      );
      expect(finance.releaseBookingInTransaction.mock.calls[0][0]).toBe(
        txSeen[0],
      );
      expect(finance.refundApplyDepositInTransaction.mock.calls[0][0]).toBe(
        txSeen[0],
      );
      expect(recalculatePartnerLevel).not.toHaveBeenCalled();
    });

    it('does not refund deposit when release returns false', async () => {
      prisma.booking.rows[0].status = 'AWAITING_CONFIRM';
      finance.releaseBookingInTransaction.mockResolvedValueOnce(false);
      await service.settleExpiredConfirmations();
      expect(finance.refundApplyDepositInTransaction).not.toHaveBeenCalled();
      expect(recalculatePartnerLevel).not.toHaveBeenCalled();
    });
  });
});
