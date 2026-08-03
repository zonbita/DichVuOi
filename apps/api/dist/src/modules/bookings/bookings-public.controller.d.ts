import { BookingsService } from './bookings.service';
export declare class BookingsPublicController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    listOpenBoard(page?: string, pageSize?: string): Promise<{
        items: (({
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            };
            service: {
                category: {
                    group: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        description: string | null;
                        icon: string | null;
                        sortOrder: number;
                        isFeatured: boolean;
                        supportsOnline: boolean;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    description: string | null;
                    groupId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
                description: string | null;
                supportsOnline: boolean;
                basePrice: number;
                priceMin: number;
                priceMax: number;
                unit: string;
                durationMin: number;
                isActive: boolean;
                categoryId: string;
            };
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            reviews: {
                id: string;
                createdAt: Date;
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                sortOrder: number;
                bookingId: string;
                content: string;
                source: import("@prisma/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    id: string;
                    email: string;
                    fullName: string;
                    phone: string | null;
                    partnerProfile: {
                        phoneVerified: boolean;
                        bankVerified: boolean;
                        headline: string | null;
                        city: string | null;
                        ratingAvg: number;
                        ratingCount: number;
                        level: number;
                        onlineSeconds: number;
                        isVerified: boolean;
                        avatarUrl: string | null;
                        offerings: {
                            serviceId: string;
                            price: number | null;
                        }[];
                    } | null;
                    reputationPeriods: {
                        currentPoints: number;
                    }[];
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                note: string | null;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                partnerId: string;
                bookingId: string;
                depositAmount: number;
                depositStatus: import("@prisma/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import("@prisma/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            commissionBps: number;
            commissionAmount: number;
            partnerPayout: number;
            paidAt: Date | null;
            releasedAt: Date | null;
            refundedAt: Date | null;
            confirmDeadlineAt: Date | null;
            matchingDeadlineAt: Date | null;
            responseDeadlineAt: Date | null;
            disputeResultNote: string | null;
            settlementPercent: number | null;
            settlementProposedBy: import("@prisma/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            partnerId: string | null;
        } & {
            applications?: {
                partnerId: string;
            }[] | undefined;
            applicationCount?: number;
        }) | (Omit<{
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            };
            service: {
                category: {
                    group: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        description: string | null;
                        icon: string | null;
                        sortOrder: number;
                        isFeatured: boolean;
                        supportsOnline: boolean;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    description: string | null;
                    groupId: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
                description: string | null;
                supportsOnline: boolean;
                basePrice: number;
                priceMin: number;
                priceMax: number;
                unit: string;
                durationMin: number;
                isActive: boolean;
                categoryId: string;
            };
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            reviews: {
                id: string;
                createdAt: Date;
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                sortOrder: number;
                bookingId: string;
                content: string;
                source: import("@prisma/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    id: string;
                    email: string;
                    fullName: string;
                    phone: string | null;
                    partnerProfile: {
                        phoneVerified: boolean;
                        bankVerified: boolean;
                        headline: string | null;
                        city: string | null;
                        ratingAvg: number;
                        ratingCount: number;
                        level: number;
                        onlineSeconds: number;
                        isVerified: boolean;
                        avatarUrl: string | null;
                        offerings: {
                            serviceId: string;
                            price: number | null;
                        }[];
                    } | null;
                    reputationPeriods: {
                        currentPoints: number;
                    }[];
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                note: string | null;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                partnerId: string;
                bookingId: string;
                depositAmount: number;
                depositStatus: import("@prisma/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import("@prisma/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            commissionBps: number;
            commissionAmount: number;
            partnerPayout: number;
            paidAt: Date | null;
            releasedAt: Date | null;
            refundedAt: Date | null;
            confirmDeadlineAt: Date | null;
            matchingDeadlineAt: Date | null;
            responseDeadlineAt: Date | null;
            disputeResultNote: string | null;
            settlementPercent: number | null;
            settlementProposedBy: import("@prisma/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            partnerId: string | null;
        } & {
            applications?: unknown;
        }, "applications"> & {
            applicationCount: number;
            applications: {
                partnerId: string;
            }[] | undefined;
            applyDepositAmount: number;
            applyDepositBps: number;
            applyDepositPercent: number;
        }))[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
}
