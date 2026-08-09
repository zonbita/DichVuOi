import { BookingsService } from './bookings.service';
export declare class BookingsPublicController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    listOpenBoard(page?: string, pageSize?: string): Promise<{
        items: (({
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            applications: ({
                partner: {
                    id: string;
                    partnerProfile: {
                        headline: string | null;
                        city: string | null;
                        ratingAvg: number;
                        ratingCount: number;
                        level: number;
                        onlineSeconds: number;
                        isVerified: boolean;
                        phoneVerified: boolean;
                        bankVerified: boolean;
                        avatarUrl: string | null;
                        offerings: {
                            serviceId: string;
                            price: number | null;
                        }[];
                    } | null;
                    email: string;
                    fullName: string;
                    phone: string | null;
                    reputationPeriods: {
                        currentPoints: number;
                    }[];
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import("@prisma/client").$Enums.PaymentStatus;
            })[];
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            };
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        slug: string;
                        name: string;
                        supportsOnline: boolean;
                        sortOrder: number;
                        icon: string | null;
                        isFeatured: boolean;
                    };
                } & {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    name: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                name: string;
                basePrice: number;
                priceMin: number;
                priceMax: number;
                unit: string;
                durationMin: number;
                supportsOnline: boolean;
                isActive: boolean;
                categoryId: string;
            };
            reviews: {
                id: string;
                createdAt: Date;
                fromUserId: string;
                toUserId: string;
                rating: number;
                comment: string | null;
            }[];
            requirements: {
                id: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                sortOrder: number;
                source: import("@prisma/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            customerName: string;
            customerPhone: string;
            address: string;
            note: string | null;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            scheduledAt: Date;
            publishAt: Date | null;
            jobTitle: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            totalPrice: number;
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
            createdAt: Date;
            updatedAt: Date;
        } & {
            applications?: {
                partnerId: string;
            }[] | undefined;
            applicationCount?: number;
        }) | (Omit<{
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            applications: ({
                partner: {
                    id: string;
                    partnerProfile: {
                        headline: string | null;
                        city: string | null;
                        ratingAvg: number;
                        ratingCount: number;
                        level: number;
                        onlineSeconds: number;
                        isVerified: boolean;
                        phoneVerified: boolean;
                        bankVerified: boolean;
                        avatarUrl: string | null;
                        offerings: {
                            serviceId: string;
                            price: number | null;
                        }[];
                    } | null;
                    email: string;
                    fullName: string;
                    phone: string | null;
                    reputationPeriods: {
                        currentPoints: number;
                    }[];
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import("@prisma/client").$Enums.PaymentStatus;
            })[];
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            };
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        slug: string;
                        name: string;
                        supportsOnline: boolean;
                        sortOrder: number;
                        icon: string | null;
                        isFeatured: boolean;
                    };
                } & {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    name: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                name: string;
                basePrice: number;
                priceMin: number;
                priceMax: number;
                unit: string;
                durationMin: number;
                supportsOnline: boolean;
                isActive: boolean;
                categoryId: string;
            };
            reviews: {
                id: string;
                createdAt: Date;
                fromUserId: string;
                toUserId: string;
                rating: number;
                comment: string | null;
            }[];
            requirements: {
                id: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                sortOrder: number;
                source: import("@prisma/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            customerName: string;
            customerPhone: string;
            address: string;
            note: string | null;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            scheduledAt: Date;
            publishAt: Date | null;
            jobTitle: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            totalPrice: number;
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
            createdAt: Date;
            updatedAt: Date;
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
    getPublicOpen(id: string): Promise<({
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        applications: ({
            partner: {
                id: string;
                partnerProfile: {
                    headline: string | null;
                    city: string | null;
                    ratingAvg: number;
                    ratingCount: number;
                    level: number;
                    onlineSeconds: number;
                    isVerified: boolean;
                    phoneVerified: boolean;
                    bankVerified: boolean;
                    avatarUrl: string | null;
                    offerings: {
                        serviceId: string;
                        price: number | null;
                    }[];
                } | null;
                email: string;
                fullName: string;
                phone: string | null;
                reputationPeriods: {
                    currentPoints: number;
                }[];
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import("@prisma/client").$Enums.PaymentStatus;
        })[];
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    name: string;
                    supportsOnline: boolean;
                    sortOrder: number;
                    icon: string | null;
                    isFeatured: boolean;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                name: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            name: string;
            basePrice: number;
            priceMin: number;
            priceMax: number;
            unit: string;
            durationMin: number;
            supportsOnline: boolean;
            isActive: boolean;
            categoryId: string;
        };
        reviews: {
            id: string;
            createdAt: Date;
            fromUserId: string;
            toUserId: string;
            rating: number;
            comment: string | null;
        }[];
        requirements: {
            id: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            sortOrder: number;
            source: import("@prisma/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        customerName: string;
        customerPhone: string;
        address: string;
        note: string | null;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        scheduledAt: Date;
        publishAt: Date | null;
        jobTitle: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        totalPrice: number;
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
        createdAt: Date;
        updatedAt: Date;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        applications: ({
            partner: {
                id: string;
                partnerProfile: {
                    headline: string | null;
                    city: string | null;
                    ratingAvg: number;
                    ratingCount: number;
                    level: number;
                    onlineSeconds: number;
                    isVerified: boolean;
                    phoneVerified: boolean;
                    bankVerified: boolean;
                    avatarUrl: string | null;
                    offerings: {
                        serviceId: string;
                        price: number | null;
                    }[];
                } | null;
                email: string;
                fullName: string;
                phone: string | null;
                reputationPeriods: {
                    currentPoints: number;
                }[];
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import("@prisma/client").$Enums.PaymentStatus;
        })[];
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    name: string;
                    supportsOnline: boolean;
                    sortOrder: number;
                    icon: string | null;
                    isFeatured: boolean;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                name: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            name: string;
            basePrice: number;
            priceMin: number;
            priceMax: number;
            unit: string;
            durationMin: number;
            supportsOnline: boolean;
            isActive: boolean;
            categoryId: string;
        };
        reviews: {
            id: string;
            createdAt: Date;
            fromUserId: string;
            toUserId: string;
            rating: number;
            comment: string | null;
        }[];
        requirements: {
            id: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            sortOrder: number;
            source: import("@prisma/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        customerName: string;
        customerPhone: string;
        address: string;
        note: string | null;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        scheduledAt: Date;
        publishAt: Date | null;
        jobTitle: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        totalPrice: number;
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
        createdAt: Date;
        updatedAt: Date;
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
    })>;
    listPublicActivity(limit?: string): Promise<{
        items: {
            id: string;
            kind: "open" | "apply" | "completed";
            label: string;
            serviceName: string;
            at: string;
        }[];
    }>;
    listRecentCompleted(limit?: string): Promise<{
        items: {
            id: string;
            serviceName: string;
            serviceSlug: string;
            completedAt: string;
            partnerUserId: string;
            partnerName: string;
            partnerAvatarUrl: string | null;
        }[];
    }>;
}
