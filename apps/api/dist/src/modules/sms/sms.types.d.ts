export type SmsSendResult = {
    ok: true;
    provider: 'esms' | 'mock';
    messageId?: string;
    sandbox?: boolean;
};
export type SmsProviderName = 'esms' | 'mock';
