import type { QueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { publicPartnerQueryOptions } from './query-client';

/** Warm lazy chunk + React Query cache trước khi click vào chi tiết bài đăng. */
export function prefetchPublicPartnerPost(
  queryClient: QueryClient,
  userId: string,
  postId: string,
) {
  if (!userId || !postId) return;

  void import('../pages/partner-service-post-detail-page');

  void queryClient.prefetchQuery({
    queryKey: ['partner', 'public-post', userId, postId],
    queryFn: () => api.getPublicPartnerPost(userId, postId),
    ...publicPartnerQueryOptions,
  });
}
