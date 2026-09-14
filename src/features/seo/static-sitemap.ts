import { siteUrl } from '../../data/site';
import {
  buildSitemapUrlSetXml,
  latestSitemapLastModified,
  type SitemapUrlEntry,
} from './sitemap-xml';

/**
 * CMS 밖에서 관리하는 공개 페이지의 마지막 의미 있는 콘텐츠 변경일 원장.
 *
 * 새 정적 페이지를 추가하거나 본문·메타데이터를 바꾸면 해당 페이지 날짜만
 * 함께 갱신한다. 배포 시각을 쓰지 않아 무관한 페이지의 lastmod가 한꺼번에
 * 바뀌지 않는다.
 *
 * 이 배포는 블로그 전용 서브도메인이라 `/`는 `/column`으로 301된다(PLAN.md
 * §2.1). 그래서 목록에는 세 기능의 목록 페이지만 둔다.
 */
const STATIC_PAGE_LASTMOD = {
  column: '2026-09-15T00:00:00.000Z',
  reviews: '2026-09-15T00:00:00.000Z',
  faq: '2026-09-15T00:00:00.000Z',
} as const;

function staticPage(path: string, lastmod: string): SitemapUrlEntry {
  return { loc: siteUrl(path), lastmod };
}

/**
 * 일반 페이지 사이트맵. CMS 칼럼·후기·FAQ 글은 각자의 전용 사이트맵이
 * 소유하므로 여기에는 목록 페이지만 넣는다.
 */
export const STATIC_SITEMAP_ENTRIES: readonly SitemapUrlEntry[] = [
  staticPage('/column', STATIC_PAGE_LASTMOD.column),
  staticPage('/reviews', STATIC_PAGE_LASTMOD.reviews),
  staticPage('/faq', STATIC_PAGE_LASTMOD.faq),
];

export const STATIC_SITEMAP_LASTMOD = latestSitemapLastModified(
  STATIC_SITEMAP_ENTRIES.flatMap((entry) => (entry.lastmod ? [entry.lastmod] : [])),
  STATIC_PAGE_LASTMOD.column,
);

export function buildStaticSitemapXml(): string {
  return buildSitemapUrlSetXml(STATIC_SITEMAP_ENTRIES);
}
