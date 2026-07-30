export declare class CreateRequirementDto {
    content: string;
}
export declare class UpdateRequirementDto {
    partnerDone?: boolean;
    customerConfirmed?: boolean;
    evidenceUrl?: string;
}
export declare class ConfirmBookingDto {
    acceptIncomplete?: boolean;
}
