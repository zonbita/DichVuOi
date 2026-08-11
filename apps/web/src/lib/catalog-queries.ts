import { api } from '../services/api';
import type { Service, ServiceGroup, ServiceGroupTree } from '../types/catalog';
import {
  fetchCatalogWithCache,
  readCatalogCache,
  readCatalogCacheUpdatedAt,
} from './catalog-cache';
import { catalogQueryOptions } from './query-client';

/**
 * Catalog: hiện localStorage trước (initialData), rồi mới check API (refetch).
 * API lỗi thì giữ bản đã lưu.
 */
export const catalogQueries = {
  groupsAll: {
    queryKey: ['groups', 'all'] as const,
    queryFn: () =>
      fetchCatalogWithCache('groupsAll', () => api.getGroups(false)),
    initialData: (): ServiceGroup[] | undefined =>
      readCatalogCache<ServiceGroup[]>('groupsAll'),
    initialDataUpdatedAt: readCatalogCacheUpdatedAt,
    ...catalogQueryOptions,
  },
  groupsTree: {
    queryKey: ['groups', 'tree'] as const,
    queryFn: () =>
      fetchCatalogWithCache('groupsTree', api.getGroupsTree),
    initialData: (): ServiceGroupTree[] | undefined =>
      readCatalogCache<ServiceGroupTree[]>('groupsTree'),
    initialDataUpdatedAt: readCatalogCacheUpdatedAt,
    ...catalogQueryOptions,
  },
  services: {
    queryKey: ['services'] as const,
    queryFn: () =>
      fetchCatalogWithCache('services', () => api.getServices()),
    initialData: (): Service[] | undefined =>
      readCatalogCache<Service[]>('services'),
    initialDataUpdatedAt: readCatalogCacheUpdatedAt,
    ...catalogQueryOptions,
  },
};
