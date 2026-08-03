export type MailSendResult = {
    ok: true;
    provider: 'gmail' | 'mock';
    id?: string;
    mockReason?: string;
};
export declare class MailService {
    private readonly logger;
    isConfigured(): boolean;
    private gmailConfigured;
    send(opts: {
        to: string;
        subject: string;
        text: string;
        html?: string;
    }): Promise<MailSendResult>;
    private mock;
    private sendViaGmail;
}
