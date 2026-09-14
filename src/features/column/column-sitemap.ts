import { siteUrl } from '../../data/site';
import {
  buildSitemapUrlSetXml,
  latestSitemapLastModified,
} from '../seo/sitemap-xml';
import type { ColumnArchiveEntry } from './column-model';
import { columnEntryPath } from './column-model';
import type { ColumnCategory } from './column-category';

/** 칼럼이 없을 때도 목록 URL과 인덱스에 넣을 기준 수정일. */
export const COLUMN_ARCHIVE_LASTMOD = '2026-09-15T00:00:00.000Z';

/**
 * 칼럼 사이트맵 XML 생성(순수 함수).
 *
 * 정적 사이트맵(`features/seo/static-sitemap.ts`)은 코드가 소유한 라우트만 담는다.
 * 칼럼 글 주소는 ROOT-ADMIN에서 계속 늘어나므로 그 목록에 얼릴 수 없고, 목록
 * 페이지와 같은 출처 경계로 매 요청 시점에 만든다.
 */
export function columnEntryLoc(entry: Pick<ColumnArchiveEntry, 'slug' | 'category'>): string {
  return siteUrl(columnEntryPath(entry));
}

function columnEntryLastModified(entry: ColumnArchiveEntry): string {
  return entry.updatedAt ?? entry.publishedAt;
}

/**
 * 목록 화면은 글 추가·수정 때 함께 바뀌므로, 가장 최근 글의 수정일을 쓴다.
 * 이 값은 인덱스의 칼럼 자식 사이트맵 수정일에도 그대로 사용한다.
 */
export function columnSitemapLastModified(entries: readonly ColumnArchiveEntry[]): string {
  return latestSitemapLastModified(
    entries.map(columnEntryLastModified),
    COLUMN_ARCHIVE_LASTMOD,
  );
}

export function buildColumnSitemapXml(
  entries: readonly ColumnArchiveEntry[],
  categories: readonly ColumnCategory[],
): string {
  const archiveLastModified = columnSitemapLastModified(entries);
  const categoryPaths = new Map<string, string[]>();

  for (const category of categories) {
    if (category.publishedPostCount > 0) categoryPaths.set(category.path, []);
  }
  for (const entry of entries) {
    const modificationDates = categoryPaths.get(entry.category.path) ?? [];
    modificationDates.push(columnEntryLastModified(entry));
    categoryPaths.set(entry.category.path, modificationDates);
  }

  return buildSitemapUrlSetXml([
    { loc: siteUrl('/column'), lastmod: archiveLastModified },
    ...[...categoryPaths].map(([path, modificationDates]) => ({
      loc: siteUrl(path),
      lastmod: modificationDates.length > 0
        ? latestSitemapLastModified(modificationDates.slice(1), modificationDates[0]!)
        : archiveLastModified,
    })),
    ...entries.map((entry) => {
      return {
        loc: columnEntryLoc(entry),
        lastmod: columnEntryLastModified(entry),
      };
    }),
  ]);
}
