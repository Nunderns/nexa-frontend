import { request } from '@/lib/api-client';
import type { Community, Paginated } from '@/types/api';

/**
 * Communities the current user is a non-banned member of: the ones they can
 * post in, since the backend rejects posts from non-members with a 403.
 */
export const getJoinedCommunities = (page = 1, limit = 20) =>
  request<Paginated<Community>>({
    method: 'GET',
    url: '/communities/joined',
    params: { page, limit },
  });
