import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { CreateVietQrIntentDto } from './dto/create-vietqr-intent.dto';
import { TopUpDto } from './dto/top-up.dto';
export declare class FinanceController {
    private readonly finance;
    constructor(finance: FinanceService);
    getWallet(user: AuthUser): Promise<{
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
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            balanceAfter: number;
            reference: string;
        })[];
    }>;
    topUp(user: AuthUser, dto: TopUpDto): Promise<{
        currency: string;
        balance: number;
    }>;
    createVietQrIntent(user: AuthUser, dto: CreateVietQrIntentDto): {
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
    getVietQrIntentStatus(user: AuthUser, intentId: string): Promise<{
        intentId: string;
        amount: number;
        status: string;
        paidAt: string | null;
        expiresAt: string;
    }>;
    confirmVietQrIntentMock(user: AuthUser, intentId: string): Promise<{
        currency: string;
        balance: number;
        amount: number;
    }>;
    listInvoices(user: AuthUser): Promise<({
        booking: {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        };
        partner: {
            id: string;
            fullName: string;
        } | null;
        customer: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        partnerId: string | null;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        customerName: string;
        commissionAmount: number;
        partnerPayout: number;
        refundedAt: Date | null;
        bookingId: string;
        currency: string;
        invoiceNumber: string;
        customerId: string;
        serviceName: string;
        subtotal: number;
        issuedAt: Date;
        settledAt: Date | null;
    })[]>;
    getInvoice(user: AuthUser, id: string): Promise<{
        booking: {
            id: string;
            scheduledAt: Date;
            status: import("@prisma/client").$Enums.BookingStatus;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        };
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        customer: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        partnerId: string | null;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        customerName: string;
        commissionAmount: number;
        partnerPayout: number;
        refundedAt: Date | null;
        bookingId: string;
        currency: string;
        invoiceNumber: string;
        customerId: string;
        serviceName: string;
        subtotal: number;
        issuedAt: Date;
        settledAt: Date | null;
    }>;
}
