import { AdminService } from './admin.service';
import { AdminBookingQueryDto, AdminCreateServiceDto, AdminPageQueryDto, AdminPartnerQueryDto, AdminServiceQueryDto, AdminUpdateBookingDto, AdminUpdateGroupDto, AdminUpdatePartnerDto, AdminUpdateServiceDto, AdminUpdateUserDto, AdminUserQueryDto } from './dto/admin.dto';
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
    }>;
    listUsers(query: AdminUserQueryDto): Promise<{
        items: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            partnerProfile: {
                id: string;
                ratingAvg: number;
                ratingCount: number;
                level: number;
                isVerified: boolean;
                acceptingJobs: boolean;
            } | null;
            _count: {
                customerBookings: number;
                partnerBookings: number;
            };
        }[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    updateUser(id: string, dto: AdminUpdateUserDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    listPartners(query: AdminPartnerQueryDto): Promise<{
        items: ({
            user: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null;
                role: import("@prisma/client").$Enums.Role;
            };
            _count: {
                offerings: number;
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
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
        _count: {
            offerings: number;
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
            user: {
                id: string;
                email: string;
                fullName: string;
            };
            service: {
                id: string;
                name: string;
                slug: string;
            };
            _count: {
                messages: number;
                reviews: number;
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
            address: string;
            scheduledAt: Date;
            note: string | null;
            budgetMin: number | null;
            budgetMax: number | null;
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
        service: {
            id: string;
            name: string;
            slug: string;
            basePrice: number;
            unit: string;
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
            bookingId: string;
            redacted: boolean;
            body: string;
            senderId: string;
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
            createdAt: Date;
            bookingId: string;
            rating: number;
            comment: string | null;
            fromUserId: string;
            toUserId: string;
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
            createdAt: Date;
            updatedAt: Date;
            description: string;
            category: string;
            status: import("@prisma/client").$Enums.ComplaintStatus;
            bookingId: string;
            partnerUserId: string;
            evidenceNote: string | null;
            resolutionAction: import("@prisma/client").$Enums.ComplaintResolutionAction | null;
            deductionPoints: number | null;
            adminNote: string | null;
            reporterUserId: string;
            againstUserId: string | null;
            requirementIdsJson: string | null;
            resolvedAt: Date | null;
            resolvedByUserId: string | null;
        })[];
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
    }>;
    updateBooking(id: string, dto: AdminUpdateBookingDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
        };
        service: {
            id: string;
            name: string;
            slug: string;
        };
        _count: {
            messages: number;
            reviews: number;
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
        address: string;
        scheduledAt: Date;
        note: string | null;
        budgetMin: number | null;
        budgetMax: number | null;
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
            createdAt: Date;
            bookingId: string;
            rating: number;
            comment: string | null;
            fromUserId: string;
            toUserId: string;
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
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
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            redacted: boolean;
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
        name: string;
        categories: {
            id: string;
            name: string;
            _count: {
                services: number;
            };
        }[];
        slug: string;
        isFeatured: boolean;
        _count: {
            categories: number;
        };
    }[]>;
    categories(): Promise<{
        id: string;
        name: string;
        slug: string;
        group: {
            id: string;
            name: string;
            slug: string;
        };
    }[]>;
    listServices(query: AdminServiceQueryDto): Promise<{
        items: ({
            category: {
                id: string;
                name: string;
                slug: string;
                group: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            _count: {
                bookings: number;
                partners: number;
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
        })[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    }>;
    createService(dto: AdminCreateServiceDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            group: {
                id: string;
                name: string;
                slug: string;
            };
        };
        _count: {
            bookings: number;
            partners: number;
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
    }>;
    updateService(id: string, dto: AdminUpdateServiceDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            group: {
                id: string;
                name: string;
                slug: string;
            };
        };
        _count: {
            bookings: number;
            partners: number;
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
    }>;
    updateGroup(id: string, dto: AdminUpdateGroupDto): Promise<{
        id: string;
        name: string;
        slug: string;
        isFeatured: boolean;
    }>;
}
