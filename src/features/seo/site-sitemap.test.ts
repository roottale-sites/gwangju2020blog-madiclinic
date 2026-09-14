import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import { STATIC_SITEMAP_LASTMOD } from './static-sitemap';
import { buildSiteSitemapIndexXml, SITEMAP_CHILD_PATHS } from './site-sitemap';

describe('사이트맵 인덱스', () => {
  test('일반 페이지·후기·칼럼·FAQ 사이트맵과 각 실제 수정일을 한 곳에서 안내한다', () => {
    const xml = buildSiteSitemapIndexXml({
      column: '2026-08-11T00:00:00.000Z',
      faq: '2026-08-13T00:00:00.000Z',
      reviews: '2026-08-12T00:00:00.000Z',
    });

    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>');
    for (const path of SITEMAP_CHILD_PATHS) {
      expect(xml).toContain(`<loc>${siteOrigin}${path}</loc>`);
    }
    expect([...xml.matchAll(/<sitemap>/g)]).toHaveLength(4);
    expect(xml).toContain(`<lastmod>${STATIC_SITEMAP_LASTMOD}</lastmod>`);
    expect(xml).toContain('<lastmod>2026-08-11T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<lastmod>2026-08-12T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<lastmod>2026-08-13T00:00:00.000Z</lastmod>');
  });

  test('인덱스 수정일은 호출자가 준 콘텐츠 수정일을 그대로 쓴다', () => {
    const xml = buildSiteSitemapIndexXml({
      column: '2026-08-02T00:00:00.000Z',
      faq: '2026-08-04T00:00:00.000Z',
      reviews: '2026-08-03T00:00:00.000Z',
    });

    expect(xml).toContain('<lastmod>2026-08-02T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<lastmod>2026-08-03T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<lastmod>2026-08-04T00:00:00.000Z</lastmod>');
    expect(xml).not.toContain(new Date().toISOString());
  });
});
