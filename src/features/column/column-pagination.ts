import type { ColumnArchiveEntry } from './column-model';

/** 칼럼 목록은 한 페이지에 10건씩 보여 준다. */
export const COLUMN_ENTRIES_PER_PAGE = 10;

export type ColumnArchivePage<T extends ColumnArchiveEntry = ColumnArchiveEntry> = {
  items: readonly T[];
  page: number;
  pageCount: number;
  total: number;
};

export function parseColumnPageNumber(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

/**
 * 목록 상태를 GET URL로 고정한다. 페이지 1은 짧은 상위 URL을 사용해
 * 공유·되돌아가기·크롤링 모두에서 같은 목록 진입점을 가리키게 한다.
 */
export function columnArchiveUrl(page: number, searchQuery: string, basePath = '/column'): string {
  const params = new URLSearchParams();
  if (searchQuery) params.set('q', searchQuery);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();

  return `${basePath}${query ? `?${query}` : ''}#column-list-title`;
}

export function paginateColumnEntries<T extends ColumnArchiveEntry>(
  entries: readonly T[],
  requestedPage: number,
): ColumnArchivePage<T> {
  const pageCount = Math.max(1, Math.ceil(entries.length / COLUMN_ENTRIES_PER_PAGE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const start = (page - 1) * COLUMN_ENTRIES_PER_PAGE;

  return {
    items: entries.slice(start, start + COLUMN_ENTRIES_PER_PAGE),
    page,
    pageCount,
    total: entries.length,
  };
}
