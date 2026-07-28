import { QueryClient } from '@tanstack/react-query';

/** Catalog / trang chủ ít đổi — RAM + localStorage (xem catalog-cache). */
export const CATALOG_STALE_MS = 5 * 60_000;
export const CATALOG_GC_MS = 24 * 60 * 60_000;

export const catalogQueryOptions = {
  staleTime: CATALOG_STALE_MS,
  gcTime: CATALOG_GC_MS,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
