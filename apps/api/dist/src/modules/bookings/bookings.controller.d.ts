import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { ApplyBookingDto } from './dto/apply-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PartnerScheduleQueryDto } from './dto/partner-schedule-query.dto';
import { ProposeSettlementDto } from './dto/settlement.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { ConfirmBookingDto, CreateRequirementDto, UpdateRequirementDto } from './dto/update-requirement.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(user: AuthUser, dto: CreateBookingDto): Promise<({
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
    listMine(user: AuthUser): Promise<(({
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
    customerPublishSchedule(user: AuthUser, query: PartnerScheduleQueryDto): Promise<{
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
    rebookHints(user: AuthUser): Promise<{
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
    listPartnerMine(user: AuthUser): Promise<(({
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
    partnerSchedule(user: AuthUser, query: PartnerScheduleQueryDto): Promise<{
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
    listOpen(user: AuthUser): Promise<(({
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
    listMessages(user: AuthUser, id: string): Promise<({
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
    postMessage(user: AuthUser, id: string, dto: CreateBookingMessageDto): Promise<{
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
    listReviews(user: AuthUser, id: string): Promise<({
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
    createReview(user: AuthUser, id: string, dto: CreateReviewDto): Promise<{
        id: string;
        bookingId: string;
        createdAt: Date;
        fromUserId: string;
        toUserId: string;
        rating: number;
        comment: string | null;
    }>;
    payEscrow(user: AuthUser, id: string): Promise<({
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
    apply(user: AuthUser, id: string, dto: ApplyBookingDto): Promise<{
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
    listApplications(user: AuthUser, id: string): Promise<({
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
    selectApplicant(user: AuthUser, id: string, applicationId: string): Promise<({
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
    confirmCompletion(user: AuthUser, id: string, dto: ConfirmBookingDto): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
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
    proposeSettlement(user: AuthUser, id: string, dto: ProposeSettlementDto): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
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
    approveSettlement(user: AuthUser, id: string): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
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
    addRequirement(user: AuthUser, id: string, dto: CreateRequirementDto): Promise<void>;
    updateRequirement(user: AuthUser, id: string, requirementId: string, dto: UpdateRequirementDto): Promise<(import("../../common/contact-privacy").RawBookingForPrivacy & {
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
    findOne(user: AuthUser, id: string): Promise<({
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
    accept(user: AuthUser, id: string): Promise<{
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
    updateStatus(user: AuthUser, id: string, dto: UpdateBookingStatusDto): Promise<({
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
}
