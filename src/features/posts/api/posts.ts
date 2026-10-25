import { request } from '@/lib/api-client';
import type { CreatePostDTO, Paginated, Post } from '@/types/api';
import type { PostInsights, PostViewBeacon } from '../types/insights';
import type { PopularSort, PopularTimeWindow } from '../utils/popular';

/**
 * `sortBy` is deliberately not sent.
 *
 * `GET /posts?sortBy=hot` currently answers `400 property sortBy should not
 * exist`: the handler declares `@Query() pagination: PaginationDto` plus a
 * separate `@Query('sortBy')`, and the global validation pipe runs
 * `forbidNonWhitelisted`, so any key missing from `PaginationDto` is rejected
 * before the controller runs. Sending it would break every feed request, so
 * the parameter is left off until `PaginationDto` learns about it.
 */
export const postsApi = {
  getAll: (page = 1, limit = 10) =>
    request<Paginated<Post>>({ method: 'GET', url: '/posts', params: { page, limit } }),

  /** Public communities only; `geo` keeps posts read from that country. */
  getPopular: (params: {
    sort: PopularSort;
    t: PopularTimeWindow;
    geo?: string;
    page: number;
    limit: number;
  }) => request<Paginated<Post>>({ method: 'GET', url: '/posts/popular', params }),

  getById: (id: number) => request<Post>({ method: 'GET', url: `/posts/${id}` }),

  getByCommunity: (communityId: number, page = 1, limit = 10) =>
    request<Paginated<Post>>({
      method: 'GET',
      url: `/posts/community/${communityId}`,
      params: { page, limit },
    }),

  create: (data: CreatePostDTO) => request<Post>({ method: 'POST', url: '/posts', data }),

  update: (id: number, data: Partial<CreatePostDTO>) =>
    request<Post>({ method: 'PUT', url: `/posts/${id}`, data }),

  remove: (id: number) => request<void>({ method: 'DELETE', url: `/posts/${id}` }),

  /**
   * Fires the view beacon, called once per opened post.
   *
   * Failures are swallowed on purpose: reach is a nice-to-have, and a failed
   * beacon must never interrupt reading the post. The API also deduplicates
   * repeat visits, so a double render cannot double-count.
   */
  recordView: async (id: number): Promise<void> => {
    try {
      await request<PostViewBeacon>({ method: 'POST', url: `/posts/${id}/view` });
    } catch {
      // Ignored, see above.
    }
  },

  /** Rejects with 403 for anyone but the post author or a community moderator. */
  getInsights: (id: number) =>
    request<PostInsights>({ method: 'GET', url: `/posts/${id}/insights` }),
};
