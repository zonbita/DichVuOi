import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createFakePrisma, FakePrisma } from '../../testing/fake-prisma';
import { FinanceApplyDepositService } from './finance-apply-deposit.service';

describe('FinanceApplyDepositService', () => {
  let prisma: FakePrisma;
  let service: FinanceApplyDepositService;
  const partner = () => prisma.user.rows.find((u) => u.id === 'p1')!;
  const ledger = () => prisma.walletTransaction.rows;

  beforeEach(() => {
    prisma = createFakePrisma();
    service = new FinanceApplyDepositService(
      prisma as unknown as PrismaService,
    );
    prisma.user.seed({ id: 'p1', walletBalance: 200_000 });
    prisma.booking.seed({
      id: 'b1',
      totalPrice: 1_000_000,
      applyDepositBps: 1000,
      service: { name: 'Sua dien' },
    });
  });

  describe('holdApplyDeposit', () => {
    it('debits bps of totalPrice and writes APPLY_DEPOSIT ledger', async () => {
      await expect(service.holdApplyDeposit('b1', 'p1', 'a1')).resolves.toEqual(
        { amount: 100_000 },
      );
      expect(partner().walletBalance).toBe(100_000);
      expect(ledger()[0]).toMatchObject({
        type: 'APPLY_DEPOSIT',
        amount: -100_000,
        balanceAfter: 100_000,
        reference: 'apply-hold:a1',
      });
    });

    it('is idempotent per application (reference)', async () => {
      await service.holdApplyDeposit('b1', 'p1', 'a1');
      await expect(service.holdApplyDeposit('b1', 'p1', 'a1')).resolves.toEqual(
        { amount: 100_000 },
      );
      expect(partner().walletBalance).toBe(100_000);
      expect(ledger()).toHaveLength(1);
    });

    it('honours explicit amount and returns 0 without debit for 0 bps', async () => {
      await service.holdApplyDeposit('b1', 'p1', 'a1', { amount: 5_000 });
      expect(partner().walletBalance).toBe(195_000);
      prisma.booking.rows[0].applyDepositBps = 0;
      await expect(service.holdApplyDeposit('b1', 'p1', 'a2')).resolves.toEqual(
        { amount: 0 },
      );
      expect(ledger()).toHaveLength(1);
    });

    it('rejects insufficient balance / missing booking', async () => {
      partner().walletBalance = 99_999;
      await expect(service.holdApplyDeposit('b1', 'p1', 'a1')).rejects.toThrow(
        BadRequestException,
      );
      expect(partner().walletBalance).toBe(99_999);
      expect(ledger()).toHaveLength(0);
      await expect(service.holdApplyDeposit('zz', 'p1', 'a1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refundApplyDeposit', () => {
    it('credits partner once, APPLY_REFUND ledger, idempotent', async () => {
      await expect(
        service.refundApplyDeposit('b1', 'p1', 'a1', 100_000),
      ).resolves.toBe(true);
      await expect(
        service.refundApplyDeposit('b1', 'p1', 'a1', 100_000),
      ).resolves.toBe(false);
      expect(partner().walletBalance).toBe(300_000);
      expect(ledger()).toEqual([
        expect.objectContaining({
          type: 'APPLY_REFUND',
          amount: 100_000,
          balanceAfter: 300_000,
          reference: 'apply-refund:a1',
        }),
      ]);
    });

    it('ignores non-positive amounts', async () => {
      await expect(
        service.refundApplyDepositInTransaction(
          prisma as never,
          'b1',
          'p1',
          'a1',
          0,
        ),
      ).resolves.toBe(false);
      expect(ledger()).toHaveLength(0);
    });
  });

  describe('forfeitApplyDeposit', () => {
    it('does not move money, writes 0-amount APPLY_FORFEIT audit row, idempotent', async () => {
      await expect(
        service.forfeitApplyDeposit('b1', 'p1', 'a1', 100_000, 'no-show'),
      ).resolves.toBe(true);
      await expect(
        service.forfeitApplyDeposit('b1', 'p1', 'a1', 100_000, 'no-show'),
      ).resolves.toBe(false);
      expect(partner().walletBalance).toBe(200_000);
      expect(ledger()).toEqual([
        expect.objectContaining({
          type: 'APPLY_FORFEIT',
          amount: 0,
          balanceAfter: 200_000,
          reference: 'apply-forfeit:a1',
        }),
      ]);
    });

    it('throws when partner missing', async () => {
      await expect(
        service.forfeitApplyDeposit('b1', 'ghost', 'a1', 1, 'x'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
