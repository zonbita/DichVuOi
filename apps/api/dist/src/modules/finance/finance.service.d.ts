import { BookingStatus, Prisma } from '../../database/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
type SettlementOptions = {
    status?: BookingStatus;
    expectedStatus?: BookingStatus;
    disputeResultNote?: string | null;
};
type PercentSettlementOptions = {
    expectedStatus?: BookingStatus;
    disputeResultNote?: string | null;
};
type ApplyDepositOptions = {
    amount?: number;
};
export declare class FinanceService {
    private readonly prisma;
    private readonly mail;
    constructor(prisma: PrismaService, mail: MailService);
    private readonly vietQrBankId;
    private readonly vietQrAccountNo;
    private readonly vietQrAccountName;
    private readonly vietQrIntentSecret;
    private readonly vietQrIntentTtlMs;
    private vietQrBanksCache;
    getWallet(userId: string): Promise<{
        currency: string;
        balance: number;
        mockPaymentsEnabled: boolean;
        emailVerified: boolean;
        bankVerified: boolean;
        canWithdraw: boolean;
        payout: {
            bankBin: string | null;
            bankCode: string | null;
            bankName: string | null;
            accountNo: string | null;
            accountName: string | null;
        };
        transactions: ({
            booking: {
                id: string;
                service: {
                    name: string;
                };
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            description: string;
            type: import(".prisma/client/client").$Enums.WalletTransactionType;
            bookingId: string | null;
            amount: number;
            balanceAfter: number;
            reference: string;
        })[];
    }>;
    private assertMockPaymentsAllowed;
    listVietQrBanks(): Promise<{
        id: number;
        name: string;
        code: string;
        bin: string;
        shortName: string;
        logo: string;
        transferSupported: number;
    }[]>;
    withdraw(userId: string, dto: {
        amount: number;
        bankBin: string;
        bankCode?: string;
        bankName: string;
        accountNo: string;
        accountName: string;
    }): Promise<{
        currency: string;
        balance: number;
        amount: number;
        status: string;
        payout: {
            bankBin: string | null;
            bankCode: string | null;
            bankName: string | null;
            accountNo: string | null;
            accountName: string | null;
        };
        message: string;
    }>;
    requestBankVerify(userId: string, dto: {
        bankBin: string;
        bankCode?: string;
        bankName: string;
        accountNo: string;
        accountName: string;
    }): Promise<{
        ok: boolean;
        channel: "gmail";
        expiresAt: string;
        payout: {
            bankBin: string;
            bankCode: string | null;
            bankName: string;
            accountNo: string;
            accountName: string;
        };
        message: string;
        code?: undefined;
    } | {
        ok: boolean;
        channel: "mock";
        expiresAt: string;
        code: string;
        payout: {
            bankBin: string;
            bankCode: string | null;
            bankName: string;
            accountNo: string;
            accountName: string;
        };
        message: string;
    }>;
    confirmBankVerify(userId: string, dto: {
        code: string;
    }): Promise<{
        currency: string;
        balance: number;
        mockPaymentsEnabled: boolean;
        emailVerified: boolean;
        bankVerified: boolean;
        canWithdraw: boolean;
        payout: {
            bankBin: string | null;
            bankCode: string | null;
            bankName: string | null;
            accountNo: string | null;
            accountName: string | null;
        };
        transactions: ({
            booking: {
                id: string;
                service: {
                    name: string;
                };
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            description: string;
            type: import(".prisma/client/client").$Enums.WalletTransactionType;
            bookingId: string | null;
            amount: number;
            balanceAfter: number;
            reference: string;
        })[];
    }>;
    topUp(userId: string, amount: number): Promise<{
        currency: string;
        balance: number;
    }>;
    adminAdjustBalance(userId: string, amount: number, reason: string): Promise<{
        currency: string;
        balance: number;
        amount: number;
        user: {
            id: string;
            fullName: string;
            email: string;
        };
    }>;
    createVietQrIntent(userId: string, amount: number): {
        intentId: string;
        amount: number;
        currency: string;
        bankId: string;
        accountNo: string;
        accountName: string;
        transferNote: string;
        qrImageUrl: string;
        expiresAt: string;
    };
    getVietQrIntentStatus(userId: string, intentId: string): Promise<{
        intentId: string;
        amount: number;
        status: string;
        paidAt: string | null;
        expiresAt: string;
    }>;
    confirmVietQrIntentMock(userId: string, intentId: string): Promise<{
        currency: string;
        balance: number;
        amount: number;
    }>;
    listInvoices(userId: string): Promise<({
        partner: {
            id: string;
            fullName: string;
        } | null;
        booking: {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        };
        customer: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import(".prisma/client/client").$Enums.InvoiceStatus;
        customerName: string;
        commissionAmount: number;
        partnerPayout: number;
        refundedAt: Date | null;
        partnerId: string | null;
        bookingId: string;
        currency: string;
        invoiceNumber: string;
        customerId: string;
        serviceName: string;
        subtotal: number;
        issuedAt: Date;
        settledAt: Date | null;
    })[]>;
    getInvoice(invoiceId: string, userId: string, isAdmin?: boolean): Promise<{
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        booking: {
            id: string;
            scheduledAt: Date;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        };
        customer: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import(".prisma/client/client").$Enums.InvoiceStatus;
        customerName: string;
        commissionAmount: number;
        partnerPayout: number;
        refundedAt: Date | null;
        partnerId: string | null;
        bookingId: string;
        currency: string;
        invoiceNumber: string;
        customerId: string;
        serviceName: string;
        subtotal: number;
        issuedAt: Date;
        settledAt: Date | null;
    }>;
    holdBooking(bookingId: string, payerId: string): Promise<void>;
    releaseBooking(bookingId: string, options?: SettlementOptions): Promise<boolean>;
    releaseBookingInTransaction(tx: Prisma.TransactionClient, bookingId: string, options?: SettlementOptions): Promise<boolean>;
    refundBooking(bookingId: string, options?: SettlementOptions): Promise<boolean>;
    refundBookingInTransaction(tx: Prisma.TransactionClient, bookingId: string, options?: SettlementOptions): Promise<boolean>;
    releaseBookingByPercent(bookingId: string, percent: number, options?: PercentSettlementOptions): Promise<boolean>;
    holdApplyDeposit(bookingId: string, partnerId: string, applicationId: string, options?: ApplyDepositOptions): Promise<{
        amount: number;
    }>;
    refundApplyDeposit(bookingId: string, partnerId: string, applicationId: string, amount: number): Promise<boolean>;
    refundApplyDepositInTransaction(tx: Prisma.TransactionClient, bookingId: string, partnerId: string, applicationId: string, amount: number): Promise<boolean>;
    forfeitApplyDeposit(bookingId: string, partnerId: string, applicationId: string, amount: number, reason: string): Promise<boolean>;
    private invoiceNumber;
    private vietQrImageUrl;
    private signVietQrIntent;
    private verifyVietQrIntent;
}
export {};
