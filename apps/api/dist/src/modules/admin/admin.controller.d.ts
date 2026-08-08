import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AdminBookingQueryDto, AdminCreateServiceDto, AdminAdjustWalletDto, AdminFinanceTxQueryDto, AdminFinanceWalletQueryDto, AdminPageQueryDto, AdminPartnerQueryDto, AdminReviewServicePostDto, AdminServicePostQueryDto, AdminServiceQueryDto, AdminUpdateBookingDto, AdminUpdateGroupDto, AdminUpdatePartnerDto, AdminUpdateServiceDto, AdminUpdateUserDto, AdminUserQueryDto } from './dto/admin.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    stats(): Promise<{
        users: number;
        partners: number;
        partnersPendingVerify: number;
        bookings: number;
        openJobs: number;
        completed: number;
        cancelled: number;
        escrowHeldCount: number;
        escrowHeldAmount: number;
        escrowReleasedCount: number;
        commissionEarned: number;
        gmvCompleted: number;
        reviews: number;
        redactedMessages: number;
        complaintsPending: number;
        servicePostsPending: number;
        supportOpen: number;
    }>;
    gmvSeries(days?: string): Promise<{
        days: number;
        points: {
            date: string;
            gmv: number;
        }[];
        total: number;
    }>;
    listAuditLogs(query: AdminPageQueryDto): Promise<{
        items: {
            id: string;
            action: string;
            targetType: string | null;
            targetId: string | null;
            meta: Record<string, unknown> | null;
            createdAt: Date;
            actor: {
                id: string;
                email: string;
                fullName: string;
            };
        }[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    financeOverview(): Promise<{
        currency: string;
        totalWalletBalance: number;
        walletsWithBalance: number;
        escrowHeldCount: number;
        escrowHeldAmount: number;
        commissionEarned: number;
        withdrawnTotal: number;
        recentTransactions: ({
            user: {
                id: string;
                email: string;
                fullName: string;
            };
            booking: {
                id: string;
                service: {
                    name: string;
                };
            } | null;
        } & {
            id: string;
            description: string;
            createdAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            bookingId: string | null;
            balanceAfter: number;
            reference: string;
        })[];
    }>;
    listFinanceWallets(query: AdminFinanceWalletQueryDto): Promise<{
        items: {
            id: string;
            updatedAt: Date;
            bankName: string | null;
            bankAccountNo: string | null;
            bankAccountName: string | null;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            walletBalance: number;
        }[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    listFinanceTransactions(query: AdminFinanceTxQueryDto): Promise<{
        items: ({
            user: {
                id: string;
                email: string;
                fullName: string;
            };
            booking: {
                id: string;
                service: {
                    name: string;
                };
            } | null;
        } & {
            id: string;
            description: string;
            createdAt: Date;
            userId: string;
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            bookingId: string | null;
            balanceAfter: number;
            reference: string;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    adjustWallet(userId: string, dto: AdminAdjustWalletDto): Promise<{
        currency: string;
        balance: number;
        amount: number;
        user: {
            id: string;
            fullName: string;
            email: string;
        };
    }>;
    listUsers(query: AdminUserQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            _count: {
                customerBookings: number;
                partnerBookings: number;
            };
            partnerProfile: {
                id: string;
                ratingAvg: number;
                ratingCount: number;
                level: number;
                isVerified: boolean;
                acceptingJobs: boolean;
            } | null;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        }[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    updateUser(actor: AuthUser, id: string, dto: AdminUpdateUserDto): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        fullName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        isBlocked: boolean;
        chatBanned: boolean;
    }>;
    listPartners(query: AdminPartnerQueryDto): Promise<{
        items: ({
            _count: {
                offerings: number;
            };
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                role: import("@prisma/client").$Enums.Role;
                isBlocked: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            headline: string | null;
            bio: string | null;
            city: string | null;
            districts: string | null;
            ratingAvg: number;
            ratingCount: number;
            level: number;
            onlineSeconds: number;
            lastOnlineAt: Date | null;
            isVerified: boolean;
            phoneVerified: boolean;
            bankVerified: boolean;
            bankName: string | null;
            bankAccountNo: string | null;
            bankAccountName: string | null;
            phoneOtpCode: string | null;
            phoneOtpExpiresAt: Date | null;
            bankVerifyIntentId: string | null;
            bankVerifyExpiresAt: Date | null;
            avatarUrl: string | null;
            galleryJson: string | null;
            skillsJson: string | null;
            acceptingJobs: boolean;
            workModes: string | null;
            responseMinutes: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    updatePartner(userId: string, dto: AdminUpdatePartnerDto): Promise<{
        _count: {
            offerings: number;
        };
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            isBlocked: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        onlineSeconds: number;
        lastOnlineAt: Date | null;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        bankName: string | null;
        bankAccountNo: string | null;
        bankAccountName: string | null;
        phoneOtpCode: string | null;
        phoneOtpExpiresAt: Date | null;
        bankVerifyIntentId: string | null;
        bankVerifyExpiresAt: Date | null;
        avatarUrl: string | null;
        galleryJson: string | null;
        skillsJson: string | null;
        acceptingJobs: boolean;
        workModes: string | null;
        responseMinutes: number;
    }>;
    listBookings(query: AdminBookingQueryDto): Promise<{
        items: ({
            _count: {
                messages: number;
                reviews: number;
            };
            service: {
                id: string;
                slug: string;
                name: string;
            };
            user: {
                id: string;
                email: string;
                fullName: string;
            };
            partner: {
                id: string;
                email: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            serviceId: string;
            partnerId: string | null;
            status: import("@prisma/client").$Enums.BookingStatus;
            address: string;
            scheduledAt: Date;
            publishAt: Date | null;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
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
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    getBooking(id: string): Promise<{
        service: {
            id: string;
            slug: string;
            name: string;
            basePrice: number;
            unit: string;
        };
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
        messages: ({
            sender: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            redacted: boolean;
            bookingId: string;
            body: string;
            senderId: string;
        })[];
        reviews: ({
            toUser: {
                id: string;
                fullName: string;
            };
            fromUser: {
                id: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        })[];
        complaints: ({
            reporter: {
                id: string;
                fullName: string;
            };
            against: {
                id: string;
                fullName: string;
            } | null;
            resolvedBy: {
                id: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            status: import("@prisma/client").$Enums.ComplaintStatus;
            bookingId: string;
            reporterUserId: string;
            partnerUserId: string;
            againstUserId: string | null;
            requirementIdsJson: string | null;
            evidenceNote: string | null;
            deductionPoints: number | null;
            adminNote: string | null;
            resolutionAction: import("@prisma/client").$Enums.ComplaintResolutionAction | null;
            resolvedAt: Date | null;
            resolvedByUserId: string | null;
        })[];
        requirements: {
            id: string;
            sortOrder: number;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            content: string;
            source: import("@prisma/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        serviceId: string;
        partnerId: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        address: string;
        scheduledAt: Date;
        publishAt: Date | null;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
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
    }>;
    updateBooking(id: string, dto: AdminUpdateBookingDto): Promise<{
        _count: {
            messages: number;
            reviews: number;
        };
        service: {
            id: string;
            slug: string;
            name: string;
        };
        user: {
            id: string;
            email: string;
            fullName: string;
        };
        partner: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        serviceId: string;
        partnerId: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        address: string;
        scheduledAt: Date;
        publishAt: Date | null;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
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
    }>;
    listReviews(query: AdminPageQueryDto): Promise<{
        items: ({
            booking: {
                id: string;
                service: {
                    name: string;
                };
                status: import("@prisma/client").$Enums.BookingStatus;
            };
            toUser: {
                id: string;
                email: string;
                fullName: string;
            };
            fromUser: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            comment: string | null;
            fromUserId: string;
            toUserId: string;
            rating: number;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    listServicePostQueue(query: AdminPageQueryDto): Promise<{
        items: {
            partnerProfileId: string;
            userId: string;
            fullName: string;
            email: string;
            avatarUrl: string | null;
            level: number;
            pendingCount: number;
            oldestPendingAt: Date | null;
            firstPostId: string;
            posts: {
                id: string;
                title: string;
                serviceName: string;
                createdAt: Date;
            }[];
        }[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    listServicePosts(query: AdminServicePostQueryDto): Promise<{
        items: {
            id: string;
            title: string;
            body: string;
            coverUrl: string;
            images: string[];
            status: import("@prisma/client").$Enums.PartnerServicePostStatus;
            rejectReason: string | null;
            reviewedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            service: {
                id: string;
                slug: string;
                name: string;
                category: {
                    name: string;
                    group: {
                        slug: string;
                        name: string;
                    };
                };
            };
            partner: {
                userId: string;
                fullName: string;
                email: string;
            };
        }[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    getServicePost(id: string): Promise<{
        post: {
            id: string;
            title: string;
            body: string;
            coverUrl: string;
            images: string[];
            serviceId: string;
            status: import("@prisma/client").$Enums.PartnerServicePostStatus;
            rejectReason: string | null;
            reviewedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            service: {
                id: string;
                slug: string;
                name: string;
                unit: string;
                category: {
                    id: string;
                    slug: string;
                    name: string;
                    group: {
                        id: string;
                        slug: string;
                        name: string;
                    };
                };
            };
        };
        seller: {
            userId: string;
            fullName: string;
            email: string;
            headline: string | null;
            city: string | null;
            avatarUrl: string | null;
            level: number;
            isVerified: boolean;
            phoneVerified: boolean;
            bankVerified: boolean;
            ratingAvg: number;
            ratingCount: number;
            responseMinutes: number;
            acceptingJobs: boolean;
        };
        offering: {
            id: string;
            price: number | null;
            headline: string | null;
            experienceYears: number;
            includes: string | null;
            excludes: string | null;
            coverageNote: string | null;
            unit: string;
        } | null;
        siblingPending: {
            id: string;
            title: string;
            serviceName: string;
        }[];
    }>;
    reviewServicePost(user: AuthUser, id: string, dto: AdminReviewServicePostDto): Promise<{
        id: string;
        title: string;
        status: import("@prisma/client").$Enums.PartnerServicePostStatus;
        rejectReason: string | null;
        reviewedAt: Date | null;
        service: {
            id: string;
            slug: string;
            name: string;
        };
        partner: {
            userId: string;
            fullName: string;
        };
    }>;
    listFlagged(query: AdminPageQueryDto): Promise<{
        items: ({
            booking: {
                id: string;
                service: {
                    name: string;
                };
                status: import("@prisma/client").$Enums.BookingStatus;
            };
            sender: {
                id: string;
                email: string;
                fullName: string;
                chatBanned: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            redacted: boolean;
            bookingId: string;
            body: string;
            senderId: string;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    catalog(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        slug: string;
        name: string;
        isFeatured: boolean;
        categories: {
            id: string;
            name: string;
            _count: {
                services: number;
            };
        }[];
        _count: {
            categories: number;
        };
    }[]>;
    categories(): Promise<{
        id: string;
        slug: string;
        name: string;
        group: {
            id: string;
            slug: string;
            name: string;
        };
    }[]>;
    listServices(query: AdminServiceQueryDto): Promise<{
        items: ({
            _count: {
                bookings: number;
                partners: number;
            };
            category: {
                id: string;
                slug: string;
                name: string;
                group: {
                    id: string;
                    slug: string;
                    name: string;
                };
            };
        } & {
            id: string;
            slug: string;
            name: string;
            description: string | null;
            supportsOnline: boolean;
            createdAt: Date;
            updatedAt: Date;
            basePrice: number;
            priceMin: number;
            priceMax: number;
            unit: string;
            durationMin: number;
            isActive: boolean;
            categoryId: string;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    createService(dto: AdminCreateServiceDto): Promise<{
        _count: {
            bookings: number;
            partners: number;
        };
        category: {
            id: string;
            slug: string;
            name: string;
            group: {
                id: string;
                slug: string;
                name: string;
            };
        };
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        supportsOnline: boolean;
        createdAt: Date;
        updatedAt: Date;
        basePrice: number;
        priceMin: number;
        priceMax: number;
        unit: string;
        durationMin: number;
        isActive: boolean;
        categoryId: string;
    }>;
    updateService(id: string, dto: AdminUpdateServiceDto): Promise<{
        _count: {
            bookings: number;
            partners: number;
        };
        category: {
            id: string;
            slug: string;
            name: string;
            group: {
                id: string;
                slug: string;
                name: string;
            };
        };
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        supportsOnline: boolean;
        createdAt: Date;
        updatedAt: Date;
        basePrice: number;
        priceMin: number;
        priceMax: number;
        unit: string;
        durationMin: number;
        isActive: boolean;
        categoryId: string;
    }>;
    updateGroup(id: string, dto: AdminUpdateGroupDto): Promise<{
        id: string;
        slug: string;
        name: string;
        isFeatured: boolean;
    }>;
}
