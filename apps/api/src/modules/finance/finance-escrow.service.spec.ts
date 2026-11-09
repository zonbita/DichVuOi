import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createFakePrisma, FakePrisma } from '../../testing/fake-prisma';
import { FinanceEscrowService } from './finance-escrow.service';

describe('FinanceEscrowService', () => {
  let prisma: FakePrisma;
  let service: FinanceEscrowService;
  let tx: any;

  const seedHeld = (over: Record<string, unknown> = {}) => {
    prisma.user.seed(
      { id: 'cust', walletBalance: 0 },
      { id: 'partner', walletBalance: 50_000 },
    );
    prisma.booking.seed({
      id: 'b1',
      userId: 'cust',
      partnerId: 'partner',
      totalPrice: 1_000_000,
      commissionBps: 1500,
      status: 'AWAITING_CONFIRM',
      paymentStatus: 'HELD',
      ...over,
    });
    prisma.invoice.seed({ bookingId: 'b1', status: 'PAID' });
  };
  const user = (id: string) => prisma.user.rows.find((u) => u.id === id)!;
  const booking = () => prisma.booking.rows.find((b) => b.id === 'b1')!;
  const ledger = () => prisma.walletTransaction.rows;

  beforeEach(() => {
    prisma = createFakePrisma();
    tx = prisma;
    service = new FinanceEscrowService(prisma as unknown as PrismaService);
  });

  describe('holdBooking', () => {
    beforeEach(() => {
      prisma.user.seed({ id: 'cust', walletBalance: 1_500_000 });
      prisma.booking.seed({
        id: 'booking-0001',
        userId: 'cust',
        partnerId: null,
        totalPrice: 1_000_000,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        customerName: 'Khach',
        service: { name: 'Don dep' },
        user: { walletBalance: 1_500_000 },
      });
    });

    it('debits customer, marks HELD, writes ESCROW_HOLD ledger + PAID invoice', async () => {
      await service.holdBooking('booking-0001', 'cust');

      expect(user('cust').walletBalance).toBe(500_000);
      const b = prisma.booking.rows[0];
      expect(b.paymentStatus).toBe('HELD');
      expect(b.paidAt).toBeInstanceOf(Date);
      expect(ledger()).toHaveLength(1);
      expect(ledger()[0]).toMatchObject({
        userId: 'cust',
        type: 'ESCROW_HOLD',
        amount: -1_000_000,
        balanceAfter: 500_000,
        reference: 'hold:booking-0001',
      });
      expect(prisma.invoice.rows[0]).toMatchObject({
        bookingId: 'booking-0001',
        subtotal: 1_000_000,
        status: 'PAID',
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('rejects insufficient balance without touching wallet', async () => {
      user('cust').walletBalance = 999_999;
      prisma.booking.rows[0].user = { walletBalance: 999_999 };
      await expect(service.holdBooking('booking-0001', 'cust')).rejects.toThrow(
        BadRequestException,
      );
      expect(user('cust').walletBalance).toBe(999_999);
      expect(ledger()).toHaveLength(0);
    });

    it('rejects when conditional debit loses a race (balance changed)', async () => {
      // snapshot says enough money, but the real row no longer has it
      user('cust').walletBalance = 10;
      await expect(service.holdBooking('booking-0001', 'cust')).rejects.toThrow(
        'Số dư ví không đủ',
      );
      expect(ledger()).toHaveLength(0);
    });

    it('rejects non-payer, missing booking, cancelled or already paid', async () => {
      await expect(service.holdBooking('booking-0001', 'x')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.holdBooking('nope', 'cust')).rejects.toThrow(
        NotFoundException,
      );
      prisma.booking.rows[0].paymentStatus = 'HELD';
      await expect(service.holdBooking('booking-0001', 'cust')).rejects.toThrow(
        BadRequestException,
      );
      prisma.booking.rows[0].status = 'CANCELLED';
      await expect(service.holdBooking('booking-0001', 'cust')).rejects.toThrow(
        'Đơn đã hủy',
      );
      expect(user('cust').walletBalance).toBe(1_500_000);
    });
  });

  describe('releaseBookingInTransaction', () => {
    it('pays partner total minus 15% commission and settles invoice', async () => {
      seedHeld();
      const ok = await service.releaseBookingInTransaction(tx, 'b1', {
        expectedStatus: 'AWAITING_CONFIRM',
        status: 'COMPLETED',
      });

      expect(ok).toBe(true);
      expect(user('partner').walletBalance).toBe(50_000 + 850_000);
      expect(user('cust').walletBalance).toBe(0);
      expect(booking()).toMatchObject({
        paymentStatus: 'RELEASED',
        status: 'COMPLETED',
        commissionAmount: 150_000,
        partnerPayout: 850_000,
        confirmDeadlineAt: null,
      });
      expect(ledger()).toEqual([
        expect.objectContaining({
          userId: 'partner',
          type: 'PARTNER_PAYOUT',
          amount: 850_000,
          balanceAfter: 900_000,
          reference: 'payout:b1',
        }),
      ]);
      expect(prisma.invoice.rows[0]).toMatchObject({
        status: 'SETTLED',
        commissionAmount: 150_000,
        partnerPayout: 850_000,
        partnerId: 'partner',
      });
    });

    it('falls back to default 15% when commissionBps is 0', async () => {
      seedHeld({ commissionBps: 0 });
      await service.releaseBookingInTransaction(tx, 'b1');
      expect(booking().commissionAmount).toBe(150_000);
    });

    it('is idempotent: second call returns false and does not double-pay', async () => {
      seedHeld();
      expect(await service.releaseBookingInTransaction(tx, 'b1')).toBe(true);
      expect(await service.releaseBookingInTransaction(tx, 'b1')).toBe(false);
      expect(user('partner').walletBalance).toBe(900_000);
      expect(ledger()).toHaveLength(1);
    });

    it('returns false without paying when expectedStatus does not match', async () => {
      seedHeld({ status: 'DISPUTED' });
      const ok = await service.releaseBookingInTransaction(tx, 'b1', {
        expectedStatus: 'AWAITING_CONFIRM',
      });
      expect(ok).toBe(false);
      expect(booking().paymentStatus).toBe('HELD');
      expect(user('partner').walletBalance).toBe(50_000);
      expect(ledger()).toHaveLength(0);
    });

    it('rejects when escrow is not HELD or there is no partner', async () => {
      seedHeld({ paymentStatus: 'REFUNDED' });
      await expect(
        service.releaseBookingInTransaction(tx, 'b1'),
      ).rejects.toThrow(BadRequestException);
      booking().paymentStatus = 'HELD';
      booking().partnerId = null;
      await expect(
        service.releaseBookingInTransaction(tx, 'b1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.releaseBookingInTransaction(tx, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('releaseBooking wraps it in $transaction', async () => {
      seedHeld();
      await expect(service.releaseBooking('b1')).resolves.toBe(true);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('refundBookingInTransaction', () => {
    it('refunds full price to customer, ledger ESCROW_REFUND, invoice REFUNDED', async () => {
      seedHeld();
      const ok = await service.refundBookingInTransaction(tx, 'b1', {
        status: 'CANCELLED',
      });
      expect(ok).toBe(true);
      expect(user('cust').walletBalance).toBe(1_000_000);
      expect(user('partner').walletBalance).toBe(50_000);
      expect(booking()).toMatchObject({
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      });
      expect(ledger()).toEqual([
        expect.objectContaining({
          userId: 'cust',
          type: 'ESCROW_REFUND',
          amount: 1_000_000,
          balanceAfter: 1_000_000,
          reference: 'refund:b1',
        }),
      ]);
      expect(prisma.invoice.rows[0].status).toBe('REFUNDED');
    });

    it('is idempotent', async () => {
      seedHeld();
      await service.refundBookingInTransaction(tx, 'b1');
      expect(await service.refundBookingInTransaction(tx, 'b1')).toBe(false);
      expect(user('cust').walletBalance).toBe(1_000_000);
      expect(ledger()).toHaveLength(1);
    });

    it('cannot refund a released booking', async () => {
      seedHeld({ paymentStatus: 'RELEASED' });
      await expect(
        service.refundBookingInTransaction(tx, 'b1'),
      ).rejects.toThrow(BadRequestException);
      expect(user('cust').walletBalance).toBe(0);
    });
  });

  describe('releaseBookingByPercentInTransaction', () => {
    it('60%: partner gets 60% minus commission, customer gets 40% back', async () => {
      seedHeld();
      const ok = await service.releaseBookingByPercentInTransaction(
        tx,
        'b1',
        60,
      );
      expect(ok).toBe(true);
      // gross 600_000, commission 90_000
      expect(user('partner').walletBalance).toBe(50_000 + 510_000);
      expect(user('cust').walletBalance).toBe(400_000);
      expect(booking()).toMatchObject({
        paymentStatus: 'RELEASED',
        status: 'COMPLETED',
        commissionAmount: 90_000,
        partnerPayout: 510_000,
      });
      expect(booking().refundedAt).toBeInstanceOf(Date);
      expect(ledger().map((l) => [l.type, l.amount, l.reference])).toEqual([
        ['PARTNER_PAYOUT', 510_000, 'payout:b1'],
        ['ESCROW_REFUND', 400_000, 'partial-refund:b1'],
      ]);
      // money conservation: payout + commission + refund == totalPrice
      expect(510_000 + 90_000 + 400_000).toBe(1_000_000);
      expect(prisma.invoice.rows[0].status).toBe('SETTLED');
    });

    it('100%: no customer refund ledger entry', async () => {
      seedHeld();
      await service.releaseBookingByPercentInTransaction(tx, 'b1', 100);
      expect(user('cust').walletBalance).toBe(0);
      expect(ledger()).toHaveLength(1);
      expect(booking().refundedAt).toBeNull();
    });

    it.each([0, 101, -5, NaN, Infinity])(
      'rejects invalid percent %p',
      async (p) => {
        seedHeld();
        await expect(
          service.releaseBookingByPercentInTransaction(tx, 'b1', p),
        ).rejects.toThrow(BadRequestException);
        expect(booking().paymentStatus).toBe('HELD');
        expect(ledger()).toHaveLength(0);
      },
    );

    it('is idempotent and checks expectedStatus', async () => {
      seedHeld();
      await expect(
        service.releaseBookingByPercentInTransaction(tx, 'b1', 50, {
          expectedStatus: 'DISPUTED' as any,
        }),
      ).rejects.toThrow(BadRequestException);
      await service.releaseBookingByPercentInTransaction(tx, 'b1', 50);
      expect(
        await service.releaseBookingByPercentInTransaction(tx, 'b1', 50),
      ).toBe(false);
      expect(ledger()).toHaveLength(2);
    });
  });
});
