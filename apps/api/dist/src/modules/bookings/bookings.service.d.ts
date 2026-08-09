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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    findOne(id: string, viewer?: Viewer): Promise<({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    listMineAsCustomer(userId: string): Promise<(({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    }))[]>;
    publishDueScheduledBookings(): Promise<void>;
    listCustomerPublishSchedule(userId: string, year: number, month: number): Promise<{
        year: number;
        month: number;
        daysInMonth: number;
        items: ({
            day: number;
            startHour: number;
            endHour: number;
            durationMin: number;
            durationHours: number;
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[] & {
                partnerId: string;
            }[];
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            applicationCount?: number;
        } | {
            day: number;
            startHour: number;
            endHour: number;
            durationMin: number;
            durationHours: number;
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            customerName: string;
            customerPhone: string;
            address: string;
            note: string | null;
            userId: string;
            partnerId: string | null;
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            };
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            })[] & {
                partnerId: string;
            }[];
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            applicationCount?: number;
        } | {
            day: number;
            startHour: number;
            endHour: number;
            durationMin: number;
            durationHours: number;
            partner: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            } | null;
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
            customerName: string;
            customerPhone: string;
            address: string;
            note: string | null;
            userId: string;
            partnerId: string | null;
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
            };
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
            customerSettlementApprovedAt: Date | null;
            partnerSettlementApprovedAt: Date | null;
            settlementResolvedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    }))[]>;
    listOpenBoard(page?: number, pageSize?: number): Promise<{
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    getPublicOpenBooking(id: string): Promise<({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    listPublicActivity(limit?: number): Promise<{
        items: {
            id: string;
            kind: "open" | "apply" | "completed";
            label: string;
            serviceName: string;
            at: string;
        }[];
    }>;
    listRecentCompletedPublic(limit?: number): Promise<{
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
    accept(id: string, partnerId: string): Promise<{
        booking: ({
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
        });
        application: ({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        }) | undefined;
        depositAmount: number;
    }>;
    apply(id: string, partnerId: string, dto?: ApplyBookingDto): Promise<{
        booking: ({
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
                status: import(".prisma/client/client").$Enums.ApplicationStatus;
                note: string | null;
                partnerId: string;
                bookingId: string;
                createdAt: Date;
                updatedAt: Date;
                depositAmount: number;
                depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
                source: import(".prisma/client/client").$Enums.RequirementSource;
                partnerDone: boolean;
                partnerDoneAt: Date | null;
                customerConfirmed: boolean;
                customerConfirmedAt: Date | null;
                evidenceUrl: string | null;
            }[];
        } & {
            id: string;
            status: import(".prisma/client/client").$Enums.BookingStatus;
            paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
        });
        application: ({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
        }) | undefined;
        depositAmount: number;
    }>;
    selectApplicant(bookingId: string, applicationId: string, viewer: Viewer): Promise<({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    listApplications(bookingId: string, viewer: Viewer): Promise<({
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
        status: import(".prisma/client/client").$Enums.ApplicationStatus;
        note: string | null;
        partnerId: string;
        bookingId: string;
        createdAt: Date;
        updatedAt: Date;
        depositAmount: number;
        depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
    })[]>;
    payEscrow(id: string, viewer: Viewer): Promise<({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
    updateStatus(id: string, status: BookingStatus, viewer: Viewer, acceptIncomplete?: boolean): Promise<({
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            status: import(".prisma/client/client").$Enums.ApplicationStatus;
            note: string | null;
            partnerId: string;
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            depositAmount: number;
            depositStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
            source: import(".prisma/client/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        status: import(".prisma/client/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client/client").$Enums.PaymentStatus;
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
        settlementProposedBy: import(".prisma/client/client").$Enums.Role | null;
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
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        bookingId: string;
        createdAt: Date;
        senderId: string;
        body: string;
        redacted: boolean;
    })[]>;
    postMessage(bookingId: string, viewer: Viewer, dto: CreateBookingMessageDto): Promise<{
        sender: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        bookingId: string;
        createdAt: Date;
        senderId: string;
        body: string;
        redacted: boolean;
    }>;
    createReview(bookingId: string, viewer: Viewer, dto: CreateReviewDto): Promise<{
        id: string;
        bookingId: string;
        createdAt: Date;
        fromUserId: string;
        toUserId: string;
        rating: number;
        comment: string | null;
    }>;
    listReviews(bookingId: string, viewer: Viewer): Promise<({
        fromUser: {
            id: string;
            fullName: string;
        };
        toUser: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        bookingId: string;
        createdAt: Date;
        fromUserId: string;
        toUserId: string;
        rating: number;
        comment: string | null;
    })[]>;
}
export {};
