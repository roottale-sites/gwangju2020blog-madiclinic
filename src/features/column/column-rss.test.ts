import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import { buildColumnRssXml, COLUMN_RSS_PATH } from './column-rss';
import type { ColumnArchiveEntry } from './column-model';

function entry(overrides: Partial<ColumnArchiveEntry> = {}): ColumnArchiveEntry {
  return {
    slug: '무릎-통증',
    title: '무릎 통증은 왜 생길까요?',
    description: '무릎 통증의 흔한 원인을 확인합니다.',
    publishedAt: '2026-09-10T00:00:00+09:00',
    updatedAt: '2026-09-11T00:00:00+09:00',
    featuredImageUrl: '/madi/img/sbn01.jpg',
    category: { slug: 'knee', name: '무릎', path: '/column/knee' },
    ...overrides,
  };
}

describe('블로그 RSS', () => {
  test('공개 칼럼의 절대 URL과 한글 슬러그를 RSS 항목으로 제공한다', () => {
    const xml = buildColumnRssXml([entry()]);

    expect(xml).toContain(`<link>${siteOrigin}/column</link>`);
    expect(xml).toContain(`href="${siteOrigin}${COLUMN_RSS_PATH}"`);
    expect(xml).toContain(`<link>${siteOrigin}/column/knee/${encodeURIComponent('무릎-통증')}</link>`);
    expect(xml).toContain('<language>ko-KR</language>');
    expect(xml).toContain('<dc:creator><![CDATA[이경무]]></dc:creator>');
    expect(xml).toContain('<category><![CDATA[무릎]]></category>');
    expect(xml).toContain(`<enclosure url="${siteOrigin}/madi/img/sbn01.jpg" length="0" type="image/jpeg"/>`);
  });

  test('발행일이 최신인 글부터 제공한다', () => {
    const xml = buildColumnRssXml([
      entry({ slug: 'older', title: '이전 글', publishedAt: '2026-09-01T00:00:00+09:00' }),
      entry({ slug: 'newer', title: '최신 글', publishedAt: '2026-09-12T00:00:00+09:00' }),
    ]);

    expect(xml.indexOf('<title><![CDATA[최신 글]]></title>'))
      .toBeLessThan(xml.indexOf('<title><![CDATA[이전 글]]></title>'));
  });

  test('대표 이미지가 없는 글은 병원 로고를 enclosure로 쓴다', () => {
    const xml = buildColumnRssXml([entry({ featuredImageUrl: undefined })]);

    expect(xml).toContain(`<enclosure url="${siteOrigin}/madi/img/hi_gwangju2020_20240826.png" length="0" type="image/png"/>`);
  });
});
