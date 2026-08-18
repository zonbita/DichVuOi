export type PayosPaymentLink = {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
};
export type PayosWebhookPayload = {
    code?: string;
    desc?: string;
    success?: boolean;
    data?: Record<string, unknown> | null;
    signature?: string;
};
export type PayosWebhookData = {
    orderCode: number;
    amount: number;
    description?: string;
    reference?: string;
    paymentLinkId?: string;
    code?: string;
};
export declare class PayosService {
    private readonly logger;
    isConfigured(): boolean;
    private get clientId();
    private get apiKey();
    private get checksumKey();
    private webOrigin;
    createPaymentLink(input: {
        orderCode: number;
        amount: number;
        description: string;
        expiredAt: Date;
    }): Promise<PayosPaymentLink>;
    getPaymentLink(idOrOrderCode: string | number): Promise<{
        status: string;
        amount: number;
        orderCode: number;
    } | null>;
    verifyWebhook(payload: PayosWebhookPayload): PayosWebhookData | null;
    private signPaymentRequest;
    private signObject;
    private safeEqualHex;
}
