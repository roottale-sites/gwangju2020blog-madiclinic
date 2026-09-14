import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import {
  buildStaticSitemapXml,
  STATIC_SITEMAP_ENTRIES,
  STATIC_SITEMAP_LASTMOD,
} from './static-sitemap';

describe('정적 페이지 사이트맵', () => {
  test('세 기능의 목록 페이지만 담는다', () => {
    expect(STATIC_SITEMAP_ENTRIES.map((entry) => entry.loc)).toEqual([
      `${siteOrigin}/column`,
      `${siteOrigin}/reviews`,
      `${siteOrigin}/faq`,
    ]);
  });

  /**
   * 이 배포는 블로그 전용 서브도메인이라 `/`는 `/column`으로 301된다(PLAN.md §2.1).
   * 리다이렉트 주소를 사이트맵에 넣으면 크롤러가 매번 우회한다.
   */
  test('301되는 루트와 CMS 글은 넣지 않는다', () => {
    const xml = buildStaticSitemapXml();
    expect(xml).not.toContain(`<loc>${siteOrigin}/</loc>`);
    expect(xml).not.toContain('/column/');
    expect(xml).not.toContain('/reviews/');
    expect(xml).not.toContain('/faq/');
  });

  test('수정일은 배포 시각이 아니라 페이지별 원장 값이다', () => {
    const xml = buildStaticSitemapXml();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(`<lastmod>${STATIC_SITEMAP_LASTMOD}</lastmod>`);
    expect(xml).not.toContain(new Date().toISOString());
    expect([...xml.matchAll(/<url>/gu)]).toHaveLength(3);
  });
});
