import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type {
  ApiEnvelope,
  AuthResponse,
  Comment,
  Community,
  CommunityMember,
  CreatePostDTO,
  LoginCredentials,
  Paginated,
  Post,
  RegisterCredentials,
  User,
  Vote,
  VoteValue,
} from '../types';
import { clearSession } from './session';

/**
 * The backend registers `TransformInterceptor` globally, so every successful
 * response arrives as `{ data, success, timestamp }`. Paginated handlers add a
 * *second* wrapper because they already return `{ data, total, ... }`, which
 * makes the wire format `data.data`. Unwrapping in one place keeps every
 * caller working with plain domain objects.
 */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Reads the `message` produced by the backend `HttpExceptionFilter`. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: unknown }>;
  const message = axiosError?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (axiosError?.code === 'ERR_NETWORK') {
    return 'Cannot reach the Nexa API. Check that the backend is running.';
  }
  return fallback;
}

/**
 * Single-flight access-token refresh. Without this, concurrent 401s (the home
 * page loads posts and communities at the same time) each fire their own
 * refresh and all but the first one is rejected, logging the user out.
 */
let refreshPromise: Promise<string | null> | null = null;

/** Endpoints where a 401 describes bad input, not a bad session. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];

function isAuthEndpoint(url = ''): boolean {
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

/**
 * Reads `exp` from the access token.
 *
 * This matters because the API answers 401 for two very different situations:
 * an expired token, and an account the guard refuses (see `JwtStrategy`:
 * unverified email, deactivated account). Only the first one means the
 * session is dead. Destroying the session on the second would throw a brand
 * new user back to the login screen the moment they try to vote.
 */
function isAccessTokenExpired(): boolean {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return true;
  }

  const segment = token.split('.')[1];
  if (!segment) {
    return true;
  }

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    // Decode as UTF-8 rather than via `escape`, which is deprecated and would
    // mangle non-ASCII characters such as a username.
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return true;
    }
    return payload.exp * 1000 <= Date.now();
  } catch {
    // Unreadable token: treat it as expired rather than trusting it.
    return true;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  // Plain axios on purpose: going through `api` would re-enter this interceptor.
  try {
    const { data } = await axios.post<ApiEnvelope<AuthResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    const tokens = unwrap(data);
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

/** Broadcast so the auth context can drop its in-memory user and let the router redirect. */
export const SESSION_EXPIRED_EVENT = 'nexa:session-expired';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const expired = isAccessTokenExpired();

    // Refresh once on an actually-expired token, instead of dropping the
    // session mid-scroll 15 minutes into a visit.
    if (status === 401 && original && !original._retried && expired && !isAuthEndpoint(original.url)) {
      original._retried = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const token = await refreshPromise.finally(() => {
        refreshPromise = null;
      });

      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api.request(original);
      }
    }

    // Unrecoverable session: drop it and notify. Previously this called
    // `window.location.reload()`, which reloaded into the same guarded route
    // and could loop.
    if (status === 401 && expired && !isAuthEndpoint(original?.url)) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    // 403 is a permission decision, not an authentication problem, so the
    // session stays untouched and the caller surfaces the reason.
    return Promise.reject(error);
  },
);

/** Typed request helper that unwraps the envelope for the caller. */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return unwrap(response.data);
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  login: (credentials: LoginCredentials) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/login', data: credentials }),

  register: (credentials: RegisterCredentials) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/register', data: credentials }),

  logout: (userId: number) =>
    request<void>({ method: 'POST', url: '/auth/logout', data: { userId } }),

  refreshToken: (refreshToken: string) =>
    request<AuthResponse>({ method: 'POST', url: '/auth/refresh', data: { refreshToken } }),

  forgotPassword: (email: string) =>
    request<{ message: string }>({ method: 'POST', url: '/auth/forgot-password', data: { email } }),
};

// ---------------------------------------------------------------------------
// Posts API
// ---------------------------------------------------------------------------

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
};

// ---------------------------------------------------------------------------
// Communities API
// ---------------------------------------------------------------------------

export const communitiesApi = {
  getAll: (page = 1, limit = 20) =>
    request<Paginated<Community>>({ method: 'GET', url: '/communities', params: { page, limit } }),

  getById: (id: number) => request<Community>({ method: 'GET', url: `/communities/${id}` }),

  getByName: (name: string) => request<Community>({ method: 'GET', url: `/communities/name/${name}` }),

  join: (id: number) => request<void>({ method: 'POST', url: `/communities/${id}/join` }),

  leave: (id: number) => request<void>({ method: 'POST', url: `/communities/${id}/leave` }),

  getMembers: (id: number, page = 1, limit = 20) =>
    request<Paginated<CommunityMember>>({
      method: 'GET',
      url: `/communities/${id}/members`,
      params: { page, limit },
    }),
};

// ---------------------------------------------------------------------------
// Votes API
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Comments API
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Users API
// ---------------------------------------------------------------------------

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

  update: (id: number, data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>) =>
    request<User>({ method: 'PUT', url: `/users/${id}`, data }),
};

export default api;