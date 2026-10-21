import type { Post } from '@/types/api';

/**
 * Case-insensitive match over the fields a reader would search by: title,
 * body, community and author. The API has no search endpoint, so this runs
 * client-side.
 */
export function matchPosts(posts: Post[], query: string): Post[] {
  if (!query) {
    return [];
  }
  const needle = query.toLowerCase();
  return posts.filter((post) => {
    const inTitle = post.title?.toLowerCase().includes(needle);
    const inBody = post.content?.toLowerCase().includes(needle);
    const inCommunity = post.community?.name.toLowerCase().includes(needle);
    const inCommunityDisplay = post.community?.displayName.toLowerCase().includes(needle);
    const inAuthor = post.author?.username.toLowerCase().includes(needle);
    return Boolean(inTitle || inBody || inCommunity || inCommunityDisplay || inAuthor);
  });
}
