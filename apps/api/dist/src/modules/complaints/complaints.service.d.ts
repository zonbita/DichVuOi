import { ComplaintStatus } from '../../database/prisma/client';
import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { FinanceService } from '../finance/finance.service';
import { AdminResolveComplaintDto, CreateComplaintDto } from './dto/complaint.dto';
export declare class ComplaintsService {
    private readonly prisma;
    private readonly reputation;
    private readonly finance;
    constructor(prisma: PrismaService, reputation: ReputationService, finance: FinanceService);
    private parseRequirementIds;
    private shapeComplaint;
    createForBooking(bookingId: string, userId: string, dto: CreateComplaintDto): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import(".prisma/client/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import(".prisma/client/client").$Enums.ComplaintResolutionAction | null;
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
    listMineAsCustomer(userId: string): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import(".prisma/client/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import(".prisma/client/client").$Enums.ComplaintResolutionAction | null;
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
    listForAdmin(status?: ComplaintStatus): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import(".prisma/client/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import(".prisma/client/client").$Enums.ComplaintResolutionAction | null;
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
    resolveAsAdmin(complaintId: string, admin: AuthUser, dto: AdminResolveComplaintDto): Promise<{
        id: string;
        bookingId: string;
        category: string;
        description: string;
        status: import(".prisma/client/client").$Enums.ComplaintStatus;
        deductionPoints: number | null;
        adminNote: string | null;
        resolutionAction: import(".prisma/client/client").$Enums.ComplaintResolutionAction | null;
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
    countPendingForAdmin(): Promise<number>;
    private refundHeldApplyDepositsInTransaction;
}
