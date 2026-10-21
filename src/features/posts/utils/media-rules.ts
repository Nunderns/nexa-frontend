import type { PostType } from '@/types/api';

export type MediaPostType = Extract<PostType, 'IMAGE' | 'VIDEO'>;

export const MB = 1024 * 1024;

export interface MediaRule {
  accept: string;
  maxBytes: number;
}

/** Mirrors the allow-list and size limits in the backend `media-storage.config`. */
export const MEDIA_RULES: Record<MediaPostType, MediaRule> = {
  IMAGE: { accept: 'image/jpeg,image/png,image/gif,image/webp', maxBytes: 10 * MB },
  VIDEO: { accept: 'video/mp4,video/webm,video/quicktime', maxBytes: 100 * MB },
};

export function isMediaType(type: PostType): type is MediaPostType {
  return type === 'IMAGE' || type === 'VIDEO';
}

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
