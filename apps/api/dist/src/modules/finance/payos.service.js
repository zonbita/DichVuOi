"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PayosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayosService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const PAYOS_API = 'https://api-merchant.payos.vn';
let PayosService = PayosService_1 = class PayosService {
    logger = new common_1.Logger(PayosService_1.name);
    isConfigured() {
        return Boolean(this.clientId && this.apiKey && this.checksumKey);
    }
    get clientId() {
        return process.env.PAYOS_CLIENT_ID?.trim() ?? '';
    }
    get apiKey() {
        return process.env.PAYOS_API_KEY?.trim() ?? '';
    }
    get checksumKey() {
        return process.env.PAYOS_CHECKSUM_KEY?.trim() ?? '';
    }
    webOrigin() {
        const explicit = process.env.WEB_ORIGIN?.trim();
        if (explicit)
            return explicit.replace(/\/$/, '');
        const cors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
        if (cors && cors !== '*')
            return cors.replace(/\/$/, '');
        return 'http://localhost:5173';
    }
    async createPaymentLink(input) {
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
        const json = (await res.json());
        if (!res.ok || json.code !== '00' || !json.data) {
            throw new Error(json.desc || json.code || `payos_http_${res.status}`);
        }
        return json.data;
    }
    async getPaymentLink(idOrOrderCode) {
        const res = await fetch(`${PAYOS_API}/v2/payment-requests/${encodeURIComponent(String(idOrOrderCode))}`, {
            headers: {
                'x-client-id': this.clientId,
                'x-api-key': this.apiKey,
            },
        });
        const json = (await res.json());
        if (!res.ok || json.code !== '00' || !json.data)
            return null;
        return {
            status: json.data.status ?? 'PENDING',
            amount: json.data.amount ?? 0,
            orderCode: json.data.orderCode ?? Number(idOrOrderCode),
        };
    }
    verifyWebhook(payload) {
        if (!this.isConfigured())
            return null;
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
        if (!Number.isFinite(orderCode) || !Number.isFinite(amount))
            return null;
        return {
            orderCode,
            amount,
            description: typeof data.description === 'string' ? data.description : undefined,
            reference: typeof data.reference === 'string' ? data.reference : undefined,
            paymentLinkId: typeof data.paymentLinkId === 'string' ? data.paymentLinkId : undefined,
            code: typeof data.code === 'string' ? data.code : payload.code,
        };
    }
    signPaymentRequest(fields) {
        const data = `amount=${fields.amount}&cancelUrl=${fields.cancelUrl}&description=${fields.description}&orderCode=${fields.orderCode}&returnUrl=${fields.returnUrl}`;
        return (0, crypto_1.createHmac)('sha256', this.checksumKey).update(data).digest('hex');
    }
    signObject(object) {
        const sorted = Object.keys(object)
            .sort()
            .reduce((acc, key) => {
            acc[key] = object[key];
            return acc;
        }, {});
        const query = Object.keys(sorted)
            .filter((key) => sorted[key] !== undefined)
            .map((key) => {
            let value = sorted[key];
            if (Array.isArray(value)) {
                value = JSON.stringify(value.map((item) => item && typeof item === 'object'
                    ? Object.keys(item)
                        .sort()
                        .reduce((acc, k) => {
                        acc[k] = item[k];
                        return acc;
                    }, {})
                    : item));
            }
            if (value === null || value === 'null' || value === 'undefined') {
                value = '';
            }
            return `${key}=${value}`;
        })
            .join('&');
        return (0, crypto_1.createHmac)('sha256', this.checksumKey).update(query).digest('hex');
    }
    safeEqualHex(a, b) {
        const left = Buffer.from(a.toLowerCase());
        const right = Buffer.from(b.toLowerCase());
        if (left.length !== right.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(left, right);
    }
};
exports.PayosService = PayosService;
exports.PayosService = PayosService = PayosService_1 = __decorate([
    (0, common_1.Injectable)()
], PayosService);
//# sourceMappingURL=payos.service.js.map