import { ComplaintResolutionAction, ComplaintStatus } from '@prisma/client';
export declare class CreateComplaintDto {
    category: string;
    description: string;
    requirementIds?: string[];
    evidenceNote: string;
}
export declare class AdminResolveComplaintDto {
    status: ComplaintStatus;
    resolutionAction?: ComplaintResolutionAction;
    deductionPoints?: number;
    adminNote?: string;
}
export declare class AdminComplaintQueryDto {
    status?: ComplaintStatus;
}
