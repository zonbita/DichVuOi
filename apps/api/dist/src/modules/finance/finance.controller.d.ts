import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { CreateVietQrIntentDto } from './dto/create-vietqr-intent.dto';
import { TopUpDto } from './dto/top-up.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { ConfirmBankVerifyDto, RequestBankVerifyDto } from './dto/bank-verify.dto';
export declare class FinanceController {
    private readonly finance;
    constructor(finance: FinanceService);
    getWallet(user: AuthUser): Promise<{
        currency: string;
        balance: number;
        mockPaymentsEnabled: boolean;
        payosEnabled: boolean;
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
            bookingId: string | null;
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            balanceAfter: number;
            reference: string;
        })[];
    }>;
    listVietQrBanks(): Promise<{
        id: number;
        name: string;
        code: string;
        bin: string;
        shortName: string;
        logo: string;
        transferSupported: number;
    }[]>;
    withdraw(user: AuthUser, dto: WithdrawDto): Promise<{
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
    requestBankVerify(user: AuthUser, dto: RequestBankVerifyDto): Promise<{
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
    confirmBankVerify(user: AuthUser, dto: ConfirmBankVerifyDto): Promise<{
        currency: string;
        balance: number;
        mockPaymentsEnabled: boolean;
        payosEnabled: boolean;
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
    createVietQrIntent(user: AuthUser, dto: CreateVietQrIntentDto): Promise<{
        intentId: string;
        amount: number;
        currency: string;
        bankId: string;
        accountNo: string;
        accountName: string;
        transferNote: string;
        qrImageUrl: string;
        checkoutUrl: string | null;
        provider: "payos";
        expiresAt: string;
    } | {
        intentId: string;
        amount: number;
        currency: string;
        bankId: string;
        accountNo: string;
        accountName: string;
        transferNote: string;
        qrImageUrl: string;
        checkoutUrl: null;
        provider: "vietqr";
        expiresAt: string;
    }>;
    getVietQrIntentStatus(user: AuthUser, intentId: string): Promise<{
        intentId: string;
        amount: number;
        status: string;
        paidAt: string | null;
        expiresAt: string;
        provider: string;
    }>;
    confirmVietQrIntentMock(user: AuthUser, intentId: string): Promise<{
        currency: string;
        balance: number;
        amount: number;
    }>;
    listInvoices(user: AuthUser): Promise<({
        partner: {
            id: string;
            fullName: string;
        } | null;
        booking: {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        };
        customer: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.InvoiceStatus;
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
    getInvoice(user: AuthUser, id: string): Promise<{
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        booking: {
            id: string;
            scheduledAt: Date;
            status: import("@prisma/client").$Enums.BookingStatus;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
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
        status: import("@prisma/client").$Enums.InvoiceStatus;
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
}
