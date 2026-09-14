export const COLUMN_DATA_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const COLUMN_ALL_CACHE_TAG = 'column:all';
export const COLUMN_ARCHIVE_CACHE_TAG = 'column:archive';
export const COLUMN_CATEGORIES_CACHE_TAG = 'column:categories';

export function columnDetailCacheTag(slug: string): string {
  return `column:detail:${slug.toLowerCase()}`;
}

export function isColumnPagePath(pathname: string): boolean {
  return pathname === '/column' || pathname.startsWith('/column/');
}
