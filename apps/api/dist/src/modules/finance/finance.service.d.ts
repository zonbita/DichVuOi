import { BookingStatus, Prisma } from '../../database/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
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
    constructor(prisma: PrismaService);
    private readonly vietQrBankId;
    private readonly vietQrAccountNo;
    private readonly vietQrAccountName;
    private readonly vietQrIntentSecret;
    private readonly vietQrIntentTtlMs;
    getWallet(userId: string): Promise<{
        currency: string;
        balance: number;
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
            bookingId: string | null;
            type: import(".prisma/client/client").$Enums.WalletTransactionType;
            amount: number;
            balanceAfter: number;
            reference: string;
        })[];
    }>;
    topUp(userId: string, amount: number): Promise<{
        currency: string;
        balance: number;
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
        invoiceNumber: string;
        serviceName: string;
        subtotal: number;
        currency: string;
        issuedAt: Date;
        settledAt: Date | null;
        bookingId: string;
        customerId: string;
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
        invoiceNumber: string;
        serviceName: string;
        subtotal: number;
        currency: string;
        issuedAt: Date;
        settledAt: Date | null;
        bookingId: string;
        customerId: string;
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
