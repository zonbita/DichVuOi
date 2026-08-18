import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const PAYOS_API = 'https://api-merchant.payos.vn';

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

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);

  isConfigured(): boolean {
    return Boolean(
      this.clientId && this.apiKey && this.checksumKey,
    );
  }

  private get clientId() {
    return process.env.PAYOS_CLIENT_ID?.trim() ?? '';
  }

  private get apiKey() {
    return process.env.PAYOS_API_KEY?.trim() ?? '';
  }

  private get checksumKey() {
    return process.env.PAYOS_CHECKSUM_KEY?.trim() ?? '';
  }

  private webOrigin(): string {
    const explicit = process.env.WEB_ORIGIN?.trim();
    if (explicit) return explicit.replace(/\/$/, '');
    const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
    if (cors && cors !== '*') return cors.replace(/\/$/, '');
    return 'http://localhost:5173';
  }

  async createPaymentLink(input: {
    orderCode: number;
    amount: number;
    description: string;
    expiredAt: Date;
  }): Promise<PayosPaymentLink> {
    const returnUrl = `${this.webOrigin()}/don-cua-toi/vi`;
    const cancelUrl = returnUrl;
    const signature = this.signPaymentRequest({
      amount: input.amount,
      cancelUrl,
      description: input.description,
      orderCode: input.orderCode,
      returnUrl,
    });
    const res = await fetch(`${PAYOS_API}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        orderCode: input.orderCode,
        amount: input.amount,
        description: input.description,
        items: [
          {
            name: 'Nap vi DichVuOi',
            quantity: 1,
            price: input.amount,
          },
        ],
        cancelUrl,
        returnUrl,
        expiredAt: Math.floor(input.expiredAt.getTime() / 1000),
        signature,
      }),
    });
    const json = (await res.json()) as {
      code?: string;
      desc?: string;
      data?: PayosPaymentLink | null;
    };
    if (!res.ok || json.code !== '00' || !json.data) {
      throw new Error(json.desc || json.code || `payos_http_${res.status}`);
    }
    return json.data;
  }

  async getPaymentLink(
    idOrOrderCode: string | number,
  ): Promise<{ status: string; amount: number; orderCode: number } | null> {
    const res = await fetch(
      `${PAYOS_API}/v2/payment-requests/${encodeURIComponent(String(idOrOrderCode))}`,
      {
        headers: {
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey,
        },
      },
    );
    const json = (await res.json()) as {
      code?: string;
      data?: { status?: string; amount?: number; orderCode?: number } | null;
    };
    if (!res.ok || json.code !== '00' || !json.data) return null;
    return {
      status: json.data.status ?? 'PENDING',
      amount: json.data.amount ?? 0,
      orderCode: json.data.orderCode ?? Number(idOrOrderCode),
    };
  }

  verifyWebhook(payload: PayosWebhookPayload): PayosWebhookData | null {
    if (!this.isConfigured()) return null;
    const data = payload.data;
    const signature = payload.signature;
    if (!data || typeof data !== 'object' || typeof signature !== 'string') {
      return null;
    }
    const expected = this.signObject(data);
    if (!this.safeEqualHex(expected, signature)) {
      this.logger.warn('payOS webhook signature mismatch');
      return null;
    }
    const orderCode = Number(data.orderCode);
    const amount = Number(data.amount);
    if (!Number.isFinite(orderCode) || !Number.isFinite(amount)) return null;
    return {
      orderCode,
      amount,
      description: typeof data.description === 'string' ? data.description : undefined,
      reference: typeof data.reference === 'string' ? data.reference : undefined,
      paymentLinkId:
        typeof data.paymentLinkId === 'string' ? data.paymentLinkId : undefined,
      code: typeof data.code === 'string' ? data.code : payload.code,
    };
  }

  private signPaymentRequest(fields: {
    amount: number;
    cancelUrl: string;
    description: string;
    orderCode: number;
    returnUrl: string;
  }) {
    const data = `amount=${fields.amount}&cancelUrl=${fields.cancelUrl}&description=${fields.description}&orderCode=${fields.orderCode}&returnUrl=${fields.returnUrl}`;
    return createHmac('sha256', this.checksumKey).update(data).digest('hex');
  }

  private signObject(object: Record<string, unknown>): string {
    const sorted = Object.keys(object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = object[key];
        return acc;
      }, {});
    const query = Object.keys(sorted)
      .filter((key) => sorted[key] !== undefined)
      .map((key) => {
        let value = sorted[key] as unknown;
        if (Array.isArray(value)) {
          value = JSON.stringify(
            value.map((item) =>
              item && typeof item === 'object'
                ? Object.keys(item as object)
                    .sort()
                    .reduce<Record<string, unknown>>((acc, k) => {
                      acc[k] = (item as Record<string, unknown>)[k];
                      return acc;
                    }, {})
                : item,
            ),
          );
        }
        if (value === null || value === 'null' || value === 'undefined') {
          value = '';
        }
        return `${key}=${value as string | number | boolean}`;
      })
      .join('&');
    return createHmac('sha256', this.checksumKey).update(query).digest('hex');
  }

  private safeEqualHex(a: string, b: string) {
    const left = Buffer.from(a.toLowerCase());
    const right = Buffer.from(b.toLowerCase());
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }
}
