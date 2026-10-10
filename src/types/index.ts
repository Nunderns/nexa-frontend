/**
 * Shape of the JSON the backend actually returns.
 *
 * `TransformInterceptor` is registered globally and wraps every payload:
 *   { data: <payload>, success: true, timestamp: string }
 *
 * Paginated handlers return `{ data, total, page, limit, totalPages }`
 * themselves, so on the wire those arrive as `data.data`.
 */

/** Envelope applied to every successful response. */
export interface ApiEnvelope<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

/** Envelope produced by `HttpExceptionFilter` on failures. */
export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  errors?: unknown;
}

/** What a paginated handler resolves to once the envelope is removed. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * `hot | new | top` is what the API documents, but the parameter is currently
 * rejected with a 400, so the client does not send it yet. See `postsApi`.
 */
export type SortBy = 'hot' | 'new' | 'top';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  karma: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostAuthor {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PostCommunity {
  id: number;
  name: string;
  displayName: string;
  iconUrl?: string | null;
}

export interface Post {
  id: number;
  communityId: number;
  authorId: number;
  title: string;
  content?: string | null;
  postType: string;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** Reach counters, zero on posts that have never been viewed. */
  viewCount: number;
  shareCount: number;
  repostCount: number;
  awardCount: number;
  community: PostCommunity;
  author: PostAuthor;
  media?: Media[];
}

export interface CreatePostDTO {
  title: string;
  content: string;
  communityId: number;
  postType?: string;
}

/** One bar of the hourly views chart. The series is dense: zero hours included. */
export interface InsightsHourlyView {
  bucketStart: string;
  /** Whole hours since publication; `1` is the first full hour. */
  hour: number;
  views: number;
}

/** `countryCode` is `XX` for the "other" bucket and for unknown traffic. */
export interface InsightsCountryView {
  countryCode: string;
  views: number;
  percentage: number;
}

export interface InsightsReach {
  views: number;
  viewsLast24h: number;
  hoursTracked: number;
}

export interface InsightsEngagement {
  upvotes: number;
  downvotes: number;
  /** Null when nobody has voted, which is not the same as a 0% ratio. */
  upvoteRatio: number | null;
  comments: number;
  shares: number;
  reposts: number;
  awards: number;
}

/** Mirrors `PostInsightsResponseDto`. Author and community mods only. */
export interface PostInsights {
  postId: number;
  title: string;
  communityName: string;
  authorId: number;
  publishedAt: string;
  reach: InsightsReach;
  hourlyViews: InsightsHourlyView[];
  countries: {
    top: InsightsCountryView[];
    other: InsightsCountryView;
  };
  engagement: InsightsEngagement;
}

/** Result of the view beacon: `counted` is false when deduplicated. */
export interface PostViewBeacon {
  postId: number;
  counted: boolean;
}

export interface Community {
  id: number;
  name: string;
  displayName: string;
  description?: string | null;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  isPrivate: boolean;
  isNsfw: boolean;
  memberCount: number;
  postCount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator?: PostAuthor;
}

export interface CommunityMember {
  id: number;
  communityId: number;
  userId: number;
  role: string;
  banned: boolean;
  joinedAt: string;
  user?: PostAuthor;
}

export interface Comment {
  id: number;
  postId: number;
  authorId: number;
  /** Named `parentId` in the schema; null for a top-level comment. */
  parentId?: number | null;
  content: string;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  /** Only included by `GET /users/:id/comments`. */
  post?: {
    id: number;
    title: string;
  };
}

export interface Media {
  id: number;
  url: string;
  type: string;
  postId?: number | null;
}

/** Public profile fields only, as `ChatParticipantResponseDto` defines them. */
export interface ChatParticipant {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

/** Mirrors `MessageResponseDto`. Note: it carries no `sender` object. */
export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors `ChatResponseDto`: a one-to-one conversation. */
export interface Chat {
  id: number;
  otherParticipantId: number;
  otherParticipant: ChatParticipant;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /chats` resolves to `ChatListResponseDto`, a paginated list. */
export type ChatList = Paginated<Chat>;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * `bio` is optional on the form but `RegisterDto` rejects the request unless a
 * string is present, so it is always sent (empty string when blank).
 */
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio: string;
}

/** `1` upvote, `-1` downvote, `0` removes an existing vote. */
export type VoteValue = 1 | 0 | -1;

/** Mirrors `PostVoteResponseDto` / `CommentVoteResponseDto`. */
export interface Vote {
  userId: number;
  postId?: number;
  commentId?: number;
  vote: VoteValue;
  createdAt: string;
  updatedAt: string;
}