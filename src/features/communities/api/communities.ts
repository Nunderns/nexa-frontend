import { request } from '@/lib/api-client';
import type { Community, CommunityMember, CommunityMembership, CommunityStats, Paginated } from '@/types/api';

export const communitiesApi = {
  getAll: (page = 1, limit = 20) =>
    request<Paginated<Community>>({ method: 'GET', url: '/communities', params: { page, limit } }),

  getById: (id: number) => request<Community>({ method: 'GET', url: `/communities/${id}` }),

  getByName: (name: string) => request<Community>({ method: 'GET', url: `/communities/name/${name}` }),

  join: (id: number) => request<void>({ method: 'POST', url: `/communities/${id}/join` }),

  leave: (id: number) => request<void>({ method: 'POST', url: `/communities/${id}/leave` }),

  /** The current user's role; drives Join/Leave and the moderator-only actions. */
  getMembership: (id: number) =>
    request<CommunityMembership>({ method: 'GET', url: `/communities/${id}/membership` }),

  /** Rejects with 403 on a private community the user does not belong to. */
  getStats: (id: number) =>
    request<CommunityStats>({ method: 'GET', url: `/communities/${id}/stats` }),

  getMembers: (id: number, page = 1, limit = 20) =>
    request<Paginated<CommunityMember>>({
      method: 'GET',
      url: `/communities/${id}/members`,
      params: { page, limit },
    }),
};
