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
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            service: {
                category: {
                    group: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        description: string | null;
                        supportsOnline: boolean;
                        sortOrder: number;
                        icon: string | null;
                        isFeatured: boolean;
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
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
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
                partnerId: string;
                note: string | null;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                depositAmount: number;
                depositStatus: import("@prisma/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            publishAt: Date | null;
            jobTitle: string | null;
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
            createdAt: Date;
            updatedAt: Date;
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
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            service: {
                category: {
                    group: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
                        description: string | null;
                        supportsOnline: boolean;
                        sortOrder: number;
                        icon: string | null;
                        isFeatured: boolean;
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
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
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
                partnerId: string;
                note: string | null;
                status: import("@prisma/client").$Enums.ApplicationStatus;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                depositAmount: number;
                depositStatus: import("@prisma/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            publishAt: Date | null;
            jobTitle: string | null;
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
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        };
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        service: {
            category: {
                group: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    description: string | null;
                    supportsOnline: boolean;
                    sortOrder: number;
                    icon: string | null;
                    isFeatured: boolean;
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
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
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
            partnerId: string;
            note: string | null;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            depositAmount: number;
            depositStatus: import("@prisma/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        publishAt: Date | null;
        jobTitle: string | null;
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
        createdAt: Date;
        updatedAt: Date;
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
        partner: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
        } | null;
        service: {
            category: {
                group: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
                    description: string | null;
                    supportsOnline: boolean;
                    sortOrder: number;
                    icon: string | null;
                    isFeatured: boolean;
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
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
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
            partnerId: string;
            note: string | null;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            depositAmount: number;
            depositStatus: import("@prisma/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        publishAt: Date | null;
        jobTitle: string | null;
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
            title: string;
            serviceName: string;
            groupSlug: string | null;
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
