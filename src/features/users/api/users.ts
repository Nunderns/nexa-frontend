import { request } from '@/lib/api-client';
import type { Comment, Paginated, Post, User } from '@/types/api';

export const usersApi = {
  getById: (id: number) => request<User>({ method: 'GET', url: `/users/${id}` }),

  getByUsername: (username: string) =>
    request<User>({ method: 'GET', url: `/users/username/${username}` }),

  /** Posts authored by the user, newest first. */
  getPosts: (id: number, page = 1, limit = 10) =>
    request<Paginated<Post>>({
      method: 'GET',
      url: `/users/${id}/posts`,
      params: { page, limit },
    }),

  getComments: (id: number, page = 1, limit = 10) =>
    request<Paginated<Comment>>({
      method: 'GET',
      url: `/users/${id}/comments`,
      params: { page, limit },
    }),

  /** Posts upvoted by the user, newest first. */
  getUpvoted: (id: number, page = 1, limit = 10) =>
    request<Paginated<Post>>({
      method: 'GET',
      url: `/users/${id}/upvoted`,
      params: { page, limit },
    }),

  /** Posts downvoted by the user, newest first. */
  getDownvoted: (id: number, page = 1, limit = 10) =>
    request<Paginated<Post>>({
      method: 'GET',
      url: `/users/${id}/downvoted`,
      params: { page, limit },
    }),

  update: (id: number, data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>) =>
    request<User>({ method: 'PUT', url: `/users/${id}`, data }),
};
