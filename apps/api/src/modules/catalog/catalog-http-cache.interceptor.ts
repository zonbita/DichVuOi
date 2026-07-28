import { createHash } from 'crypto';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/** Cache-Control cho catalog công khai (ít đổi). */
export const CATALOG_CACHE_CONTROL =
  'public, max-age=60, stale-while-revalidate=300';

/**
 * Gắn Cache-Control + ETag; trả 304 khi If-None-Match khớp.
 * Áp dụng cho GET catalog list/detail (không dùng cho partners động).
 */
@Injectable()
export class CatalogHttpCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      mergeMap((data) => {
        if (data === undefined || data === null || data instanceof StreamableFile) {
          return of(data);
        }

        const body = JSON.stringify(data);
        const etag = `"${createHash('sha1').update(body).digest('hex')}"`;
        res.setHeader('Cache-Control', CATALOG_CACHE_CONTROL);
        res.setHeader('ETag', etag);
        res.setHeader('Vary', 'Accept-Encoding');

        const clientTag = req.headers['if-none-match'];
        if (typeof clientTag === 'string' && clientTag === etag) {
          res.status(304);
          return of(undefined);
        }

        return of(data);
      }),
    );
  }
}
