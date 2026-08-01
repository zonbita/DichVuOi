export declare class RequestPhoneOtpDto {
    phone: string;
}
export declare class ConfirmPhoneOtpDto {
    code: string;
}
export declare class LinkBankAccountDto {
    bankName: string;
    accountNo: string;
    accountName: string;
    bankBin?: string;
}
export declare class ConfirmBankVerifyDto {
    intentId: string;
}
