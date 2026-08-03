import { BookingStatus } from '../../database/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { ApplyBookingDto } from './dto/apply-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ConfirmBookingDto, CreateRequirementDto, UpdateRequirementDto } from './dto/update-requirement.dto';
import { PartnerRealtimeService } from './partner-realtime.service';
type Viewer = {
    id: string;
    role: string;
};
export declare class BookingsService {
    private readonly prisma;
    private readonly realtime;
    private readonly finance;
    constructor(prisma: PrismaService, realtime: PartnerRealtimeService, finance: FinanceService);
    private viewerRole;
    private shape;
    private emitBookingUpdate;
    private seedRequirementsIfEmpty;
    private partnerIncludes;
    private settleExpiredConfirmations;
    private settleExpiredMatching;
    private refundOpenApplications;
    private refundSelectedApplyDeposit;
    private forfeitSelectedApplyDeposit;
    private settleExpiredResponseSla;
    create(dto: CreateBookingDto, customerId?: string): Promise<({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    findOne(id: string, viewer?: Viewer): Promise<({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    listMineAsCustomer(userId: string): Promise<(({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    }))[]>;
    getRebookHints(userId: string): Promise<{
        lastBookedAt: string;
        partnerUserId: string;
        partnerName: string;
        partnerAvatarUrl: string | null;
        serviceSlug: string;
        serviceName: string;
        groupSlug: string;
        lastPrice: number;
        bookingCount: number;
    }[]>;
    listMineAsPartner(partnerId: string): Promise<(({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    }))[]>;
    listPartnerSchedule(partnerId: string, year: number, month: number): Promise<{
        year: number;
        month: number;
        daysInMonth: number;
        items: ({
            day: number;
            startHour: number;
            endHour: number;
            durationMin: number;
            durationHours: number;
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[] & {
                partnerId: string;
            }[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            applicationCount?: number;
        } | {
            day: number;
            startHour: number;
            endHour: number;
            durationMin: number;
            durationHours: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applicationCount: number;
            applications: {
                partnerId: string;
            }[] | undefined;
            applyDepositAmount: number;
            applyDepositPercent: number;
        })[];
    }>;
    listOpen(viewerId?: string, limit?: number): Promise<(({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    }))[]>;
    listOpenBoard(page?: number, pageSize?: number): Promise<{
        items: (({
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
        } & {
            applications?: {
                partnerId: string;
            }[] | undefined;
            applicationCount?: number;
        }) | (Omit<{
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
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
    accept(id: string, partnerId: string): Promise<{
        booking: ({
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
        } & {
            applications?: {
                partnerId: string;
            }[] | undefined;
            applicationCount?: number;
        }) | (Omit<{
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
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
        });
        application: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        }) | undefined;
        depositAmount: number;
    }>;
    apply(id: string, partnerId: string, dto?: ApplyBookingDto): Promise<{
        booking: ({
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
        } & {
            applications?: {
                partnerId: string;
            }[] | undefined;
            applicationCount?: number;
        }) | (Omit<{
            user: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            };
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
            } | null;
            service: {
                category: {
                    group: {
                        description: string | null;
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        slug: string;
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
                    name: string;
                    slug: string;
                    groupId: string;
                };
            } & {
                description: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                slug: string;
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
                comment: string | null;
                fromUserId: string;
                toUserId: string;
                rating: number;
            }[];
            requirements: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                bookingId: string;
                content: string;
                sortOrder: number;
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            applications: ({
                partner: {
                    email: string;
                    fullName: string;
                    phone: string | null;
                    id: string;
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
                partnerId: string;
                note: string | null;
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                bookingId: string;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            partnerId: string | null;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            totalPrice: number;
            customerName: string;
            customerPhone: string;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
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
        });
        application: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        }) | undefined;
        depositAmount: number;
    }>;
    selectApplicant(bookingId: string, applicationId: string, viewer: Viewer): Promise<({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    listApplications(bookingId: string, viewer: Viewer): Promise<({
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
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
        partnerId: string;
        note: string | null;
        status: import(".prisma/client/client").$Enums.ApplicationStatus;
        bookingId: string;
        depositAmount: number;
        depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
    })[]>;
    payEscrow(id: string, viewer: Viewer): Promise<({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    updateStatus(id: string, status: BookingStatus, viewer: Viewer, acceptIncomplete?: boolean): Promise<({
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<{
        user: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        };
        partner: {
            email: string;
            fullName: string;
            phone: string | null;
            id: string;
        } | null;
        service: {
            category: {
                group: {
                    description: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    slug: string;
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
                name: string;
                slug: string;
                groupId: string;
            };
        } & {
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            slug: string;
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
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        }[];
        requirements: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            sortOrder: number;
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
        applications: ({
            partner: {
                email: string;
                fullName: string;
                phone: string | null;
                id: string;
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
            partnerId: string;
            note: string | null;
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            bookingId: string;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        partnerId: string | null;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        totalPrice: number;
        customerName: string;
        customerPhone: string;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
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
    confirmCompletion(id: string, viewer: Viewer, dto?: ConfirmBookingDto): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
        partnerId: string | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
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
    })>;
    proposeSettlement(id: string, viewer: Viewer, percent: number): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
        partnerId: string | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
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
    })>;
    approveSettlement(id: string, viewer: Viewer): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
        partnerId: string | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
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
    })>;
    addRequirement(_bookingId: string, _viewer: Viewer, _dto: CreateRequirementDto): Promise<void>;
    updateRequirement(bookingId: string, requirementId: string, viewer: Viewer, dto: UpdateRequirementDto): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
        partnerId: string | null;
    } & {
        applications?: {
            partnerId: string;
        }[] | undefined;
        applicationCount?: number;
    }) | (Omit<import("../../common/contact-privacy").RawBookingForPrivacy & {
        userId: string;
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
    })>;
    private assertBookingParty;
    private assertDepositForChat;
    private assertSettlementAllowed;
    listMessages(bookingId: string, viewer: Viewer): Promise<({
        sender: {
            fullName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        bookingId: string;
        redacted: boolean;
        body: string;
        senderId: string;
    })[]>;
    postMessage(bookingId: string, viewer: Viewer, dto: CreateBookingMessageDto): Promise<{
        sender: {
            fullName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        bookingId: string;
        redacted: boolean;
        body: string;
        senderId: string;
    }>;
    createReview(bookingId: string, viewer: Viewer, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        bookingId: string;
        comment: string | null;
        fromUserId: string;
        toUserId: string;
        rating: number;
    }>;
    listReviews(bookingId: string, viewer: Viewer): Promise<({
        toUser: {
            fullName: string;
            id: string;
        };
        fromUser: {
            fullName: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        bookingId: string;
        comment: string | null;
        fromUserId: string;
        toUserId: string;
        rating: number;
    })[]>;
}
export {};
