import { describe, expect, test, vi } from 'vitest';
import { buildColumnRssXml } from '../features/column/column-rss';

// CMS 통신만 대체하고 실제 라우트와 XML 생성기의 응답 계약을 확인한다.
vi.mock('../features/column/column-source', () => ({
  resolveColumnArchive: async () => ({ status: 'ok', entries: [] }),
  resolveColumnCategories: async () => ({ status: 'ok', categories: [] }),
}));
vi.mock('../features/column/column-api', () => ({
  loadColumnRss: async () => ({ ok: true, data: buildColumnRssXml([]) }),
}));
vi.mock('../features/reviews/review-api', () => ({
  loadReviewArchive: async () => ({ ok: true, data: [] }),
}));
vi.mock('../features/faq/faq-source', () => ({
  resolveFaqCollection: async () => ({ status: 'ok', archive: { source: 'cms', entries: [] } }),
}));

import { GET as columnRss } from './column/rss.xml/route';
import { GET as columnSitemap } from './column-sitemap.xml/route';
import { GET as columnSitemapAlias } from './column/sitemap.xml/route';
import { GET as reviewRss } from './reviews/rss.xml/route';
import { GET as reviewSitemap } from './reviews-sitemap.xml/route';
import { GET as reviewSitemapAlias } from './reviews/sitemap.xml/route';
import { GET as faqRss } from './faq/rss.xml/route';
import { GET as faqSitemap } from './faq-sitemap.xml/route';
import { GET as faqSitemapAlias } from './faq/sitemap.xml/route';
import { GET as sitemapIndex } from './sitemap.xml/route';

describe('CMS XML 응답의 CDN 캐시 경계', () => {
  test.each([
    ['/column/rss.xml', columnRss],
    ['/column-sitemap.xml', columnSitemap],
    ['/column/sitemap.xml', columnSitemapAlias],
    ['/reviews/rss.xml', reviewRss],
    ['/reviews-sitemap.xml', reviewSitemap],
    ['/reviews/sitemap.xml', reviewSitemapAlias],
    ['/faq/rss.xml', faqRss],
    ['/faq-sitemap.xml', faqSitemap],
    ['/faq/sitemap.xml', faqSitemapAlias],
    ['/sitemap.xml', sitemapIndex],
  ])('%s의 정상 빈 응답도 웹훅으로 지울 수 없는 CDN 캐시에 남기지 않는다', async (_, handler) => {
    const response = await handler();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('xml');
    expect(await response.text()).toContain('<?xml version="1.0"');
    // s-maxage가 되살아나면 초안 때 읽은 빈 피드가 발행 후에도 CDN에 남는다.
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
