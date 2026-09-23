import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import { reviewFixture as review } from './review-fixture';
import { reviewsIndexMetadata } from './review-content';
import { buildReviewRssXml, REVIEW_RSS_PATH } from './review-rss';

/** headnerve `review-rss.test.ts`를 이 저장소 픽스처·문구로 다시 쓴 것이다. */
describe('후기 RSS', () => {
  test('채널 문구와 항목 절대 URL을 마디클리닉 값으로 제공한다', () => {
    const xml = buildReviewRssXml([
      review({
        terms: [{ id: '1', taxonomy: 'category', slug: 'knee', name: '무릎' }],
        featuredImageUrl: 'https://root-cdn.com/tenants/t/media/photo.png',
      }),
    ]);

    expect(xml).toContain(`<title>${reviewsIndexMetadata.title}</title>`);
    expect(xml).toContain(`<link>${siteOrigin}/reviews</link>`);
    expect(xml).toContain(`href="${siteOrigin}${REVIEW_RSS_PATH}"`);
    expect(xml).toContain(`<link>${siteOrigin}/reviews/knee-review</link>`);
    expect(xml).toContain('<language>ko-KR</language>');
    expect(xml).toContain('<dc:creator><![CDATA[이경무 원장]]></dc:creator>');
    expect(xml).toContain('<category><![CDATA[무릎]]></category>');
    expect(xml).toContain(
      '<enclosure url="https://root-cdn.com/tenants/t/media/photo.png" length="0" type="image/png" />',
    );
  });

  test('발행일이 최신인 후기부터 제공한다', () => {
    const xml = buildReviewRssXml([
      review({ id: 'older', slug: 'older', title: '이전 후기', publishedAt: '2026-09-01T00:00:00.000Z' }),
      review({ id: 'newer', slug: 'newer', title: '최신 후기', publishedAt: '2026-09-12T00:00:00.000Z' }),
    ]);

    expect(xml.indexOf('<![CDATA[최신 후기]]>')).toBeLessThan(xml.indexOf('<![CDATA[이전 후기]]>'));
  });

  test('도판이 없는 후기는 병원 로고를 enclosure로 쓴다', () => {
    const xml = buildReviewRssXml([review()]);

    expect(xml).toContain(
      `<enclosure url="${siteOrigin}/madi/img/hi_gwangju2020_20240826.png" length="0" type="image/png" />`,
    );
  });

  test('후기가 없어도 유효한 RSS 뼈대를 만든다', () => {
    const xml = buildReviewRssXml([]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss');
    expect(xml).not.toContain('<item>');
  });
});
