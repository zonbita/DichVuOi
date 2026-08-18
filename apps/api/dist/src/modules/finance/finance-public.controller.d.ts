import { FinanceService } from './finance.service';
import type { PayosWebhookPayload } from './payos.service';
export declare class FinancePublicController {
    private readonly finance;
    constructor(finance: FinanceService);
    handlePayosWebhook(body: PayosWebhookPayload): Promise<{
        ok: boolean;
        reason: string;
        ignored?: undefined;
        credited?: undefined;
    } | {
        ok: boolean;
        ignored: boolean;
        reason?: undefined;
        credited?: undefined;
    } | {
        ok: boolean;
        credited: boolean;
        reason?: undefined;
        ignored?: undefined;
    }>;
}
