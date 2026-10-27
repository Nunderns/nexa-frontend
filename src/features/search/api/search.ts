import { request } from '@/lib/api-client';
import type { Community, Paginated, Post, User } from '@/types/api';

export const SEARCH_TYPES = ['posts', 'communities', 'users'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export interface SearchResults {
  posts: Post;
  communities: Community;
  users: User;
}

export function isSearchType(value: string | null): value is SearchType {
  return SEARCH_TYPES.includes(value as SearchType);
}

/**
 * Full-text search: every word must match and the last one may be a prefix,
 * accents ignored. Posts from private communities come back only for members.
 */
export const searchApi = {
  search: <T extends SearchType>(type: T, q: string, page = 1, limit = 10) =>
    request<Paginated<SearchResults[T]>>({
      method: 'GET',
      url: '/search',
      params: { q, type, page, limit },
    }),
};
