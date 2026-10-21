import { request } from '@/lib/api-client';
import type { Comment, Paginated } from '@/types/api';

export const commentsApi = {
  getByPost: (postId: number, page = 1, limit = 20) =>
    request<Paginated<Comment>>({
      method: 'GET',
      url: `/comments/post/${postId}`,
      params: { page, limit },
    }),

  create: (postId: number, content: string, parentCommentId?: number) =>
    request<Comment>({
      method: 'POST',
      url: `/comments/post/${postId}`,
      data: parentCommentId ? { content, parentCommentId } : { content },
    }),

  remove: (id: number) => request<void>({ method: 'DELETE', url: `/comments/${id}` }),
};
