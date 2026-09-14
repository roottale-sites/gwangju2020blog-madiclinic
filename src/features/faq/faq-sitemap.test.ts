import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import { faqFixtureEntries } from './faq-fixture';
import { FAQ_ARCHIVE_LASTMOD, buildFaqSitemapXml, faqSitemapLastModified } from './faq-sitemap';

describe('FAQ 사이트맵', () => {
  test('홈·글 있는 진료 영역·세부 질환·답변 네 단계를 담는다', () => {
    const xml = buildFaqSitemapXml(faqFixtureEntries);

    expect(xml).toContain(`<loc>${siteOrigin}/faq</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/faq/spine</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/faq/spine/neck-pain</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/faq/spine/neck-pain/mri-normal</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/faq/joint/knee/how-long</loc>`);
    // 홈 + 영역 2 + 질환 3 + 답변 4
    expect([...xml.matchAll(/<url>/gu)]).toHaveLength(10);
  });

  test('글이 없는 분류는 담지 않는다 — 크롤러에게 줄 내용이 없다', () => {
    const xml = buildFaqSitemapXml(faqFixtureEntries.filter((entry) => entry.sectionSlug === 'spine'));

    expect(xml).not.toContain('/faq/joint');
    expect([...xml.matchAll(/<url>/gu)]).toHaveLength(7);
  });

  test('글이 0건이면 홈만 남고 수정일은 원장 기준일이다', () => {
    const xml = buildFaqSitemapXml([]);

    expect([...xml.matchAll(/<url>/gu)]).toHaveLength(1);
    expect(xml).toContain(`<lastmod>${FAQ_ARCHIVE_LASTMOD}</lastmod>`);
  });

  test('가장 최근 답변 수정일을 인덱스 수정일로 쓴다', () => {
    const entries = faqFixtureEntries.slice(0, 2).map((entry, index) => ({
      ...entry,
      updatedAt: index === 0 ? '2026-09-16T00:00:00.000Z' : '2026-09-17T00:00:00.000Z',
    }));
    expect(faqSitemapLastModified(entries)).toBe('2026-09-17T00:00:00.000Z');
  });
});
