import { Injectable } from '@nestjs/common';
import { Prisma } from '../../database/prisma/client';
import type { PayosWebhookPayload } from './payos.service';
import { FinanceWalletService } from './finance-wallet.service';
import { FinanceTopUpService } from './finance-topup.service';
import { FinanceInvoiceService } from './finance-invoice.service';
import { FinanceEscrowService } from './finance-escrow.service';
import { FinanceReconciliationService } from './finance-reconciliation.service';
import { FinanceApplyDepositService } from './finance-apply-deposit.service';
import type {
  ApplyDepositOptions,
  PercentSettlementOptions,
  SettlementOptions,
} from './finance.shared';

/**
 * Facade giữ nguyên API công khai cho các module khác (bookings, admin,
 * complaints, partners). Logic nằm ở các service con cùng thư mục.
 */
@Injectable()
export class FinanceService {
  constructor(
    private readonly wallet: FinanceWalletService,
    private readonly topUps: FinanceTopUpService,
    private readonly invoices: FinanceInvoiceService,
    private readonly escrow: FinanceEscrowService,
    private readonly applyDeposits: FinanceApplyDepositService,
    private readonly reconciliation: FinanceReconciliationService,
  ) {}

  // ---- Wallet ----

  getWallet(userId: string) {
    return this.wallet.getWallet(userId);
  }

  /** Danh sách ngân hàng VietQR (cache 24h). */
  listVietQrBanks() {
    return this.wallet.listVietQrBanks();
  }

  withdraw(
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
    return this.wallet.withdraw(userId, dto);
  }

  requestBankVerify(
    userId: string,
    dto: {
      bankBin: string;
      bankCode?: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    },
  ) {
    return this.wallet.requestBankVerify(userId, dto);
  }

  confirmBankVerify(userId: string, dto: { code: string }) {
    return this.wallet.confirmBankVerify(userId, dto);
  }

  topUp(userId: string, amount: number) {
    return this.wallet.topUp(userId, amount);
  }

  adminAdjustBalance(userId: string, amount: number, reason: string) {
    return this.wallet.adminAdjustBalance(userId, amount, reason);
  }

  /** Đối soát chỉ đọc: số dư ví vs sổ cái, và escrow đang giữ. */
  reconcile() {
    return this.reconciliation.reconcile();
  }

  // ---- VietQR / payOS top-up ----

  createVietQrIntent(userId: string, amount: number) {
    return this.topUps.createVietQrIntent(userId, amount);
  }

  getVietQrIntentStatus(userId: string, intentId: string) {
    return this.topUps.getVietQrIntentStatus(userId, intentId);
  }

  handlePayosWebhook(payload: PayosWebhookPayload) {
    return this.topUps.handlePayosWebhook(payload);
  }

  confirmVietQrIntentMock(userId: string, intentId: string) {
    return this.topUps.confirmVietQrIntentMock(userId, intentId);
  }

  // ---- Invoices ----

  listInvoices(userId: string) {
    return this.invoices.listInvoices(userId);
  }

  getInvoice(invoiceId: string, userId: string, isAdmin = false) {
    return this.invoices.getInvoice(invoiceId, userId, isAdmin);
  }

  // ---- Escrow ----

  holdBooking(bookingId: string, payerId: string) {
    return this.escrow.holdBooking(bookingId, payerId);
  }

  releaseBooking(
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
    return this.escrow.releaseBooking(bookingId, options);
  }

  releaseBookingInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
    return this.escrow.releaseBookingInTransaction(tx, bookingId, options);
  }

  refundBooking(
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
    return this.escrow.refundBooking(bookingId, options);
  }

  refundBookingInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
    return this.escrow.refundBookingInTransaction(tx, bookingId, options);
  }

  releaseBookingByPercent(
    bookingId: string,
    percent: number,
    options: PercentSettlementOptions = {},
  ): Promise<boolean> {
    return this.escrow.releaseBookingByPercent(bookingId, percent, options);
  }

  releaseBookingByPercentInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    percent: number,
    options: PercentSettlementOptions = {},
  ): Promise<boolean> {
    return this.escrow.releaseBookingByPercentInTransaction(
      tx,
      bookingId,
      percent,
      options,
    );
  }

  // ---- Apply deposits ----

  holdApplyDeposit(
    bookingId: string,
    partnerId: string,
    applicationId: string,
    options: ApplyDepositOptions = {},
  ) {
    return this.applyDeposits.holdApplyDeposit(
      bookingId,
      partnerId,
      applicationId,
      options,
    );
  }

  refundApplyDeposit(
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
  ): Promise<boolean> {
    return this.applyDeposits.refundApplyDeposit(
      bookingId,
      partnerId,
      applicationId,
      amount,
    );
  }

  refundApplyDepositInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
  ): Promise<boolean> {
    return this.applyDeposits.refundApplyDepositInTransaction(
      tx,
      bookingId,
      partnerId,
      applicationId,
      amount,
    );
  }

  forfeitApplyDeposit(
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    return this.applyDeposits.forfeitApplyDeposit(
      bookingId,
      partnerId,
      applicationId,
      amount,
      reason,
    );
  }

  forfeitApplyDepositInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    return this.applyDeposits.forfeitApplyDepositInTransaction(
      tx,
      bookingId,
      partnerId,
      applicationId,
      amount,
      reason,
    );
  }
}
