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
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            id: string;
            userId: string;
            bookingId: string | null;
            balanceAfter: number;
            description: string;
            reference: string;
            createdAt: Date;
        })[];
    }>;
    listFinanceWallets(query: AdminFinanceWalletQueryDto): Promise<{
        items: {
            walletBalance: number;
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            bankName: string | null;
            bankAccountNo: string | null;
            bankAccountName: string | null;
            updatedAt: Date;
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
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            id: string;
            userId: string;
            bookingId: string | null;
            balanceAfter: number;
            description: string;
            reference: string;
            createdAt: Date;
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
            _count: {
                customerBookings: number;
                partnerBookings: number;
            };
            id: string;
            createdAt: Date;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            partnerProfile: {
                isVerified: boolean;
                id: string;
                ratingAvg: number;
                ratingCount: number;
                level: number;
                acceptingJobs: boolean;
            } | null;
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
            isVerified: boolean;
            id: string;
            userId: string;
            createdAt: Date;
            phoneVerified: boolean;
            phoneOtpExpiresAt: Date | null;
            bankName: string | null;
            bankAccountNo: string | null;
            bankAccountName: string | null;
            bankVerified: boolean;
            updatedAt: Date;
            headline: string | null;
            bio: string | null;
            city: string | null;
            districts: string | null;
            ratingAvg: number;
            ratingCount: number;
            level: number;
            onlineSeconds: number;
            lastOnlineAt: Date | null;
            phoneOtpCode: string | null;
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
        isVerified: boolean;
        id: string;
        userId: string;
        createdAt: Date;
        phoneVerified: boolean;
        phoneOtpExpiresAt: Date | null;
        bankName: string | null;
        bankAccountNo: string | null;
        bankAccountName: string | null;
        bankVerified: boolean;
        updatedAt: Date;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        onlineSeconds: number;
        lastOnlineAt: Date | null;
        phoneOtpCode: string | null;
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
            service: {
                id: string;
                slug: string;
                name: string;
            };
        } & {
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            status: import("@prisma/client").$Enums.BookingStatus;
            partnerId: string | null;
            totalPrice: number;
            budgetMin: number | null;
            budgetMax: number | null;
            applyDepositBps: number;
            commissionBps: number;
            commissionAmount: number;
            partnerPayout: number;
            settlementPercent: number | null;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            serviceId: string;
            address: string;
            scheduledAt: Date;
            publishAt: Date | null;
            jobTitle: string | null;
            note: string | null;
            customerName: string;
            customerPhone: string;
            paidAt: Date | null;
            releasedAt: Date | null;
            refundedAt: Date | null;
            confirmDeadlineAt: Date | null;
            matchingDeadlineAt: Date | null;
            responseDeadlineAt: Date | null;
            disputeResultNote: string | null;
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
            id: string;
            slug: string;
            name: string;
            basePrice: number;
            unit: string;
        };
        messages: ({
            sender: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            redacted: boolean;
            id: string;
            bookingId: string;
            createdAt: Date;
            senderId: string;
            body: string;
        })[];
        reviews: ({
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
            status: import("@prisma/client").$Enums.ComplaintStatus;
            id: string;
            bookingId: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
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
            bookingId: string;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            content: string;
            source: import("@prisma/client").$Enums.RequirementSource;
            partnerDone: boolean;
            partnerDoneAt: Date | null;
            customerConfirmed: boolean;
            customerConfirmedAt: Date | null;
            evidenceUrl: string | null;
        }[];
    } & {
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        status: import("@prisma/client").$Enums.BookingStatus;
        partnerId: string | null;
        totalPrice: number;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        commissionBps: number;
        commissionAmount: number;
        partnerPayout: number;
        settlementPercent: number | null;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        publishAt: Date | null;
        jobTitle: string | null;
        note: string | null;
        customerName: string;
        customerPhone: string;
        paidAt: Date | null;
        releasedAt: Date | null;
        refundedAt: Date | null;
        confirmDeadlineAt: Date | null;
        matchingDeadlineAt: Date | null;
        responseDeadlineAt: Date | null;
        disputeResultNote: string | null;
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
        service: {
            id: string;
            slug: string;
            name: string;
        };
    } & {
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        status: import("@prisma/client").$Enums.BookingStatus;
        partnerId: string | null;
        totalPrice: number;
        budgetMin: number | null;
        budgetMax: number | null;
        applyDepositBps: number;
        commissionBps: number;
        commissionAmount: number;
        partnerPayout: number;
        settlementPercent: number | null;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        serviceId: string;
        address: string;
        scheduledAt: Date;
        publishAt: Date | null;
        jobTitle: string | null;
        note: string | null;
        customerName: string;
        customerPhone: string;
        paidAt: Date | null;
        releasedAt: Date | null;
        refundedAt: Date | null;
        confirmDeadlineAt: Date | null;
        matchingDeadlineAt: Date | null;
        responseDeadlineAt: Date | null;
        disputeResultNote: string | null;
        settlementProposedBy: import("@prisma/client").$Enums.Role | null;
        customerSettlementApprovedAt: Date | null;
        partnerSettlementApprovedAt: Date | null;
        settlementResolvedAt: Date | null;
    }>;
    listReviews(query: AdminPageQueryDto): Promise<{
        items: ({
            booking: {
                status: import("@prisma/client").$Enums.BookingStatus;
                id: string;
                service: {
                    name: string;
                };
            };
            fromUser: {
                id: string;
                email: string;
                fullName: string;
            };
            toUser: {
                id: string;
                email: string;
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
                status: import("@prisma/client").$Enums.BookingStatus;
                id: string;
                service: {
                    name: string;
                };
            };
            sender: {
                id: string;
                email: string;
                fullName: string;
                chatBanned: boolean;
            };
        } & {
            redacted: boolean;
            id: string;
            bookingId: string;
            createdAt: Date;
            senderId: string;
            body: string;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    catalog(): import("@prisma/client").Prisma.PrismaPromise<{
        _count: {
            categories: number;
        };
        id: string;
        slug: string;
        name: string;
        isFeatured: boolean;
        categories: {
            _count: {
                services: number;
            };
            id: string;
            name: string;
        }[];
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
            description: string | null;
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
        description: string | null;
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
        description: string | null;
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
    }>;
    updateGroup(id: string, dto: AdminUpdateGroupDto): Promise<{
        id: string;
        slug: string;
        name: string;
        isFeatured: boolean;
    }>;
}
