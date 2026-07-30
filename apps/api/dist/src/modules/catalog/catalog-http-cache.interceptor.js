"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogHttpCacheInterceptor = exports.CATALOG_CACHE_CONTROL = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
exports.CATALOG_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';
let CatalogHttpCacheInterceptor = class CatalogHttpCacheInterceptor {
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        return next.handle().pipe((0, operators_1.mergeMap)((data) => {
            if (data === undefined || data === null || data instanceof common_1.StreamableFile) {
                return (0, rxjs_1.of)(data);
            }
            const body = JSON.stringify(data);
            const etag = `"${(0, crypto_1.createHash)('sha1').update(body).digest('hex')}"`;
            res.setHeader('Cache-Control', exports.CATALOG_CACHE_CONTROL);
            res.setHeader('ETag', etag);
            res.setHeader('Vary', 'Accept-Encoding');
            const clientTag = req.headers['if-none-match'];
            if (typeof clientTag === 'string' && clientTag === etag) {
                res.status(304);
                return (0, rxjs_1.of)(undefined);
            }
            return (0, rxjs_1.of)(data);
        }));
    }
};
exports.CatalogHttpCacheInterceptor = CatalogHttpCacheInterceptor;
exports.CatalogHttpCacheInterceptor = CatalogHttpCacheInterceptor = __decorate([
    (0, common_1.Injectable)()
], CatalogHttpCacheInterceptor);
//# sourceMappingURL=catalog-http-cache.interceptor.js.map