import { request } from '@/lib/api-client';
import type { Vote, VoteValue } from '@/types/api';

export const votesApi = {
  voteOnPost: (postId: number, vote: VoteValue) =>
    request<Vote>({ method: 'POST', url: `/votes/post/${postId}`, data: { vote } }),

  getPostVote: (postId: number) =>
    request<Vote | null>({ method: 'GET', url: `/votes/post/${postId}` }),

  voteOnComment: (commentId: number, vote: VoteValue) =>
    request<Vote>({ method: 'POST', url: `/votes/comment/${commentId}`, data: { vote } }),

  getCommentVote: (commentId: number) =>
    request<Vote | null>({ method: 'GET', url: `/votes/comment/${commentId}` }),
};
