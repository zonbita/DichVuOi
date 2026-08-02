import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
export declare class AdminPageQueryDto {
    q?: string;
    page?: number;
    pageSize?: number;
}
export declare class AdminUserQueryDto extends AdminPageQueryDto {
    role?: Role;
}
export declare class AdminPartnerQueryDto extends AdminPageQueryDto {
    verified?: boolean;
    acceptingJobs?: boolean;
    city?: string;
}
export declare class AdminBookingQueryDto extends AdminPageQueryDto {
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    from?: string;
    to?: string;
}
export declare class AdminServiceQueryDto extends AdminPageQueryDto {
    categoryId?: string;
    groupId?: string;
    isActive?: boolean;
}
export declare class AdminUpdateUserDto {
    role?: Role;
}
export declare class AdminUpdatePartnerDto {
    isVerified?: boolean;
    acceptingJobs?: boolean;
    phoneVerified?: boolean;
    bankVerified?: boolean;
}
export declare class AdminUpdateBookingDto {
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    note?: string;
}
export declare class AdminCreateServiceDto {
    name: string;
    slug?: string;
    categoryId: string;
    basePrice: number;
    priceMin?: number;
    priceMax?: number;
    unit?: string;
    supportsOnline?: boolean;
    durationMin?: number;
    description?: string;
    isActive?: boolean;
}
export declare class AdminUpdateServiceDto {
    name?: string;
    slug?: string;
    categoryId?: string;
    basePrice?: number;
    priceMin?: number;
    priceMax?: number;
    unit?: string;
    supportsOnline?: boolean;
    durationMin?: number;
    description?: string;
    isActive?: boolean;
}
export declare class AdminUpdateGroupDto {
    isFeatured?: boolean;
}
export declare class AdminFinanceTxQueryDto extends AdminPageQueryDto {
    type?: string;
    userId?: string;
}
export declare class AdminFinanceWalletQueryDto extends AdminPageQueryDto {
    positiveOnly?: boolean;
}
export declare class AdminAdjustWalletDto {
    amount: number;
    reason: string;
}
