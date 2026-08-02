import type { SmsSendResult } from './sms.types';
export declare function normalizeVnPhone(raw: string): string;
export declare class SmsService {
    private readonly logger;
    isLive(): boolean;
    providerName(): 'esms' | 'mock';
    sendOtpSms(phone: string, content: string): Promise<SmsSendResult>;
}
