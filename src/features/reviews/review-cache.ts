export const REVIEW_DATA_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const REVIEW_ALL_CACHE_TAG = 'reviews:all';
export const REVIEW_ARCHIVE_CACHE_TAG = 'reviews:archive';

export function reviewDetailCacheTag(slug: string): string {
  return `reviews:detail:${slug.toLowerCase()}`;
}

export function isReviewPagePath(pathname: string): boolean {
  return pathname === '/reviews' || pathname.startsWith('/reviews/');
}
