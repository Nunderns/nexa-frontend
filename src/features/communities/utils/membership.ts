import type { CommunityMembership } from '@/types/api';

export function isModerator(membership: CommunityMembership | null): boolean {
  return membership?.role === 'OWNER' || membership?.role === 'MODERATOR';
}
