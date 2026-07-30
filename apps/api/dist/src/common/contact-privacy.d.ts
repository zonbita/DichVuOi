export type ContactViewerRole = 'customer' | 'partner' | 'open_queue' | 'admin';
export type ContactPolicy = {
    channel: 'in_app';
    phoneRevealed: boolean;
    addressRevealed: boolean;
    hint: string;
};
export declare function maskPhone(phone: string | null | undefined): string;
export declare function maskEmail(email: string | null | undefined): string;
export declare function maskAddress(address: string): string;
export declare function detectContactLeak(text: string): boolean;
export declare function redactContactLeak(text: string): {
    text: string;
    redacted: boolean;
};
export declare function isDepositHeld(paymentStatus: string | null | undefined): boolean;
export declare function resolveContactPolicy(status: string, viewer: ContactViewerRole, paymentStatus?: string | null | undefined): ContactPolicy;
type BookingParty = {
    id: string;
    fullName: string;
    phone: string | null;
    email: string;
};
export type RawBookingForPrivacy = {
    status: string;
    paymentStatus?: string | null;
    customerName: string;
    customerPhone: string;
    address: string;
    note: string | null;
    userId: string;
    partnerId: string | null;
    partner?: BookingParty | null;
    user?: BookingParty | null;
    [key: string]: unknown;
};
export declare function shapeBookingForViewer<T extends RawBookingForPrivacy>(booking: T, viewer: ContactViewerRole): T & {
    contactPolicy: ContactPolicy;
    customerPhoneMasked: boolean;
    addressMasked: boolean;
};
export {};
