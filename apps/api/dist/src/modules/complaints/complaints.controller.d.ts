import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { ComplaintsService } from './complaints.service';
import { AdminComplaintQueryDto, AdminResolveComplaintDto, CreateComplaintDto } from './dto/complaint.dto';
export declare class ComplaintsController {
    private readonly complaintsService;
    constructor(complaintsService: ComplaintsService);
    createForBooking(user: AuthUser, bookingId: string, dto: CreateComplaintDto): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import("@prisma/client").$Enums.ComplaintResolutionAction | null;
        requirementIds: string[];
        evidenceNote: string | null;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        booking: {
            id: string;
            customerName: string;
            status: string;
            paymentStatus?: string;
            service: {
                name: string;
                slug: string;
            };
            requirements?: Array<{
                id: string;
                content: string;
                partnerDone: boolean;
                customerConfirmed: boolean;
            }>;
        };
        reporter: {
            id: string;
            fullName: string;
        };
        partner: {
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
    }>;
    listMine(user: AuthUser): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import("@prisma/client").$Enums.ComplaintResolutionAction | null;
        requirementIds: string[];
        evidenceNote: string | null;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        booking: {
            id: string;
            customerName: string;
            status: string;
            paymentStatus?: string;
            service: {
                name: string;
                slug: string;
            };
            requirements?: Array<{
                id: string;
                content: string;
                partnerDone: boolean;
                customerConfirmed: boolean;
            }>;
        };
        reporter: {
            id: string;
            fullName: string;
        };
        partner: {
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
    }[]>;
    listForAdmin(query: AdminComplaintQueryDto): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import("@prisma/client").$Enums.ComplaintResolutionAction | null;
        requirementIds: string[];
        evidenceNote: string | null;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        booking: {
            id: string;
            customerName: string;
            status: string;
            paymentStatus?: string;
            service: {
                name: string;
                slug: string;
            };
            requirements?: Array<{
                id: string;
                content: string;
                partnerDone: boolean;
                customerConfirmed: boolean;
            }>;
        };
        reporter: {
            id: string;
            fullName: string;
        };
        partner: {
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
    }[]>;
    resolveAsAdmin(user: AuthUser, id: string, dto: AdminResolveComplaintDto): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import("@prisma/client").$Enums.ComplaintResolutionAction | null;
        requirementIds: string[];
        evidenceNote: string | null;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        booking: {
            id: string;
            customerName: string;
            status: string;
            paymentStatus?: string;
            service: {
                name: string;
                slug: string;
            };
            requirements?: Array<{
                id: string;
                content: string;
                partnerDone: boolean;
                customerConfirmed: boolean;
            }>;
        };
        reporter: {
            id: string;
            fullName: string;
        };
        partner: {
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
    }>;
}
