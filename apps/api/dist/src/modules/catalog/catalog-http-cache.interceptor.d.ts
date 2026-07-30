import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare const CATALOG_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";
export declare class CatalogHttpCacheInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
