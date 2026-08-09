export declare class CreateBookingDto {
    serviceSlug: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address: string;
    scheduledAt: string;
    publishAt?: string;
    partnerId?: string;
    jobTitle?: string;
    note?: string;
    budgetMin?: number;
    budgetMax?: number;
    applyDepositPercent?: number;
}
