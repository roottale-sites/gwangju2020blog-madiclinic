import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import { faqFixtureEntries } from './faq-fixture';
import { buildFaqRssXml } from './faq-rss';

describe('FAQ RSS', () => {
  test('최근 수정된 질문부터 정규 경로와 답변을 제공한다', () => {
    const entries = [
      { ...faqFixtureEntries[0]!, path: '/faq/spine/neck-pain/renamed', updatedAt: '2026-09-16T00:00:00.000Z' },
      { ...faqFixtureEntries[1]!, question: '질문 & 확인', answer: '답변 <확인>', updatedAt: '2026-09-18T00:00:00.000Z' },
    ];
    const xml = buildFaqRssXml(entries);

    expect(xml).toContain(`<atom:link href="${siteOrigin}/faq/rss.xml" rel="self" type="application/rss+xml" />`);
    expect(xml).toContain(`<link>${siteOrigin}/faq/spine/neck-pain/renamed</link>`);
    expect(xml).toContain('<title><![CDATA[질문 & 확인]]></title>');
    expect(xml).toContain('<description><![CDATA[답변 <확인>]]></description>');
    expect(xml.indexOf('질문 & 확인')).toBeLessThan(xml.indexOf(entries[0]!.question));
    expect(xml).toContain('<lastBuildDate>Fri, 18 Sep 2026 00:00:00 GMT</lastBuildDate>');
    expect([...xml.matchAll(/<item>/g)]).toHaveLength(2);
  });

  test('공개 질문이 없을 때 유효한 빈 피드를 만든다', () => {
    const xml = buildFaqRssXml([]);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(`<link>${siteOrigin}/faq</link>`);
    expect(xml).not.toContain('<item>');
  });
});
