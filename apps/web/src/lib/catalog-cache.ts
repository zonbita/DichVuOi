/** Persist catalog ra localStorage để trang chủ vẫn hiện khi API tạm tắt. */

const STORAGE_KEY = 'dichvuoi_catalog_cache_v1';

export type CatalogCacheKey = 'groupsAll' | 'groupsTree' | 'services';

type CatalogCacheBlob = {
  updatedAt: number;
  groupsAll?: unknown;
  groupsTree?: unknown;
  services?: unknown;
};

/** true khi lần fetch gần nhất phải lấy từ cache (API lỗi). */
let servingStale = false;
const staleListeners = new Set<(stale: boolean) => void>();

function readBlob(): CatalogCacheBlob | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogCacheBlob;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeBlob(next: CatalogCacheBlob) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — bỏ qua */
  }
}

export function readCatalogCache<T>(key: CatalogCacheKey): T | undefined {
  const blob = readBlob();
  const value = blob?.[key];
  return value === undefined ? undefined : (value as T);
}

/** Thời điểm ghi cache — dùng cho initialDataUpdatedAt (luôn coi stale để refetch API). */
export function readCatalogCacheUpdatedAt(): number {
  return readBlob()?.updatedAt ?? 0;
}

export function writeCatalogCache(key: CatalogCacheKey, value: unknown) {
  const prev = readBlob() ?? { updatedAt: 0 };
  writeBlob({ ...prev, updatedAt: Date.now(), [key]: value });
}

export function isCatalogServingStale() {
  return servingStale;
}

export function setCatalogServingStale(stale: boolean) {
  if (servingStale === stale) return;
  servingStale = stale;
  staleListeners.forEach((listener) => listener(stale));
}

export function subscribeCatalogServingStale(listener: (stale: boolean) => void) {
  staleListeners.add(listener);
  return () => {
    staleListeners.delete(listener);
  };
}

/** Timeout ngắn khi API chết — tránh treo rồi mới hiện cache. */
const CATALOG_FETCH_MS = 4_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Catalog API timeout')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Ưu tiên hiện cache (qua initialData ở query).
 * queryFn: gọi API lại; lỗi/timeout thì trả cache nếu có.
 */
export async function fetchCatalogWithCache<T>(
  key: CatalogCacheKey,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const data = await withTimeout(fetcher(), CATALOG_FETCH_MS);
    writeCatalogCache(key, data);
    setCatalogServingStale(false);
    return data;
  } catch (error) {
    const cached = readCatalogCache<T>(key);
    if (cached !== undefined) {
      setCatalogServingStale(true);
      return cached;
    }
    setCatalogServingStale(false);
    throw error;
  }
}
