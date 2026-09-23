import { describe, expect, test } from 'vitest';

import { buildRssFeedXml } from './rss-xml';

describe('RSS 2.0 XML', () => {
  test('채널·자기 참조 링크·항목을 표준 RSS 형태로 만든다', () => {
    const xml = buildRssFeedXml({
      title: '광주 남구 마디클리닉 블로그',
      link: 'https://gwangju2020blog.madiclinic.co.kr/column',
      description: '두통 < 건강',
      selfUrl: 'https://gwangju2020blog.madiclinic.co.kr/column/rss.xml',
      language: 'ko-KR',
      items: [{
        title: '첫 글 ]]>',
        link: 'https://gwangju2020blog.madiclinic.co.kr/column/first',
        description: '설명',
        publishedAt: '2026-08-12T10:00:00+09:00',
        updatedAt: '2026-08-13T10:00:00+09:00',
        author: '이재성',
        category: '두통',
        enclosure: { url: 'https://gwangju2020blog.madiclinic.co.kr/article.webp', type: 'image/webp' },
      }],
    });

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect(xml).toContain('<title>광주 남구 마디클리닉 블로그</title>');
    expect(xml).toContain('<description>두통 &lt; 건강</description>');
    expect(xml).toContain('<language>ko-KR</language>');
    expect(xml).toContain('<atom:link href="https://gwangju2020blog.madiclinic.co.kr/column/rss.xml" rel="self" type="application/rss+xml" />');
    expect(xml).toContain('<guid isPermaLink="true">https://gwangju2020blog.madiclinic.co.kr/column/first</guid>');
    expect(xml).toContain('<pubDate>Wed, 12 Aug 2026 01:00:00 GMT</pubDate>');
    expect(xml).toContain('<lastBuildDate>Thu, 13 Aug 2026 01:00:00 GMT</lastBuildDate>');
    expect(xml).toContain('<title><![CDATA[첫 글 ]]]]><![CDATA[>]]></title>');
    expect(xml).toContain('<dc:creator><![CDATA[이재성]]></dc:creator>');
    expect(xml).toContain('<category><![CDATA[두통]]></category>');
    expect(xml).toContain('<enclosure url="https://gwangju2020blog.madiclinic.co.kr/article.webp" length="0" type="image/webp" />');
  });

  test('읽을 수 없는 날짜는 잘못된 RSS 날짜를 내보내지 않는다', () => {
    const xml = buildRssFeedXml({
      title: '제목',
      link: 'https://gwangju2020blog.madiclinic.co.kr/column',
      description: '설명',
      selfUrl: 'https://gwangju2020blog.madiclinic.co.kr/column/rss.xml',
      language: 'ko-KR',
      items: [{
        title: '날짜 없는 글',
        link: 'https://gwangju2020blog.madiclinic.co.kr/column/invalid',
        description: '설명',
        publishedAt: 'not-a-date',
      }],
    });

    expect(xml).not.toContain('<pubDate>');
    expect(xml).not.toContain('<lastBuildDate>');
    expect(xml).not.toContain('Invalid Date');
  });
});
