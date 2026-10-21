import type { TranslationKey } from '@/lib/i18n/translations';

/**
 * Tabs whose endpoints do not exist yet. The UI shows a neutral empty state
 * rather than technical detail; the backend work each one needs is recorded
 * here for whoever implements it.
 *
 *   saved    -> no SavedPost model, no GET /users/:id/saved
 *   history  -> no PostView model, views are not tracked
 *   hidden   -> Post has no isHidden column
 *
 * Empty-state copy for those tabs lives in UNSUPPORTED_TABS below.
 */
export type TabId = 'overview' | 'posts' | 'comments' | 'saved' | 'history' | 'hidden' | 'upvoted' | 'downvoted';

interface TabDefinition {
  id: TabId;
  /** Translation key, resolved with `t()` at render time. */
  label: TranslationKey;
}

export const TABS: TabDefinition[] = [
  { id: 'overview', label: 'profile.tabOverview' },
  { id: 'posts', label: 'profile.tabPosts' },
  { id: 'comments', label: 'profile.tabComments' },
  { id: 'saved', label: 'profile.tabSaved' },
  { id: 'history', label: 'profile.tabHistory' },
  { id: 'hidden', label: 'profile.tabHidden' },
  { id: 'upvoted', label: 'profile.tabUpvoted' },
  { id: 'downvoted', label: 'profile.tabDownvoted' },
];

/** Short, non-technical copy for the tabs the API cannot serve yet. */
export const UNSUPPORTED_TABS: Record<string, { title: TranslationKey; body: TranslationKey }> = {
  saved: {
    title: 'profile.savedEmptyTitle',
    body: 'profile.savedEmptyBody',
  },
  history: {
    title: 'profile.historyEmptyTitle',
    body: 'profile.historyEmptyBody',
  },
  hidden: {
    title: 'profile.hiddenEmptyTitle',
    body: 'profile.hiddenEmptyBody',
  },
};

export function isSupported(id: TabId): boolean {
  return id === 'overview' || id === 'posts' || id === 'comments' || id === 'upvoted' || id === 'downvoted';
}
