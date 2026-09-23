import { describe, expect, test } from 'vitest';

import { buildSitemapIndexXml, buildSitemapUrlSetXml } from './sitemap-xml';

describe('사이트맵 XML 표시 형식', () => {
  test('인덱스의 하위 사이트맵 주소와 수정일을 줄마다 표시한다', () => {
    const xml = buildSitemapIndexXml([{
      loc: 'https://gwangju2020blog.madiclinic.co.kr/column-sitemap.xml',
      lastmod: '2026-09-22T03:57:26.772Z',
    }]);

    expect(xml).toContain([
      '  <sitemap>',
      '    <loc>https://gwangju2020blog.madiclinic.co.kr/column-sitemap.xml</loc>',
      '    <lastmod>2026-09-22T03:57:26.772Z</lastmod>',
      '  </sitemap>',
    ].join('\n'));
  });

  test('URL 목록도 항목마다 주소와 수정일을 줄마다 표시한다', () => {
    const xml = buildSitemapUrlSetXml([{
      loc: 'https://gwangju2020blog.madiclinic.co.kr/column/knee',
      lastmod: '2026-09-22T03:57:26.772Z',
    }]);

    expect(xml).toContain([
      '  <url>',
      '    <loc>https://gwangju2020blog.madiclinic.co.kr/column/knee</loc>',
      '    <lastmod>2026-09-22T03:57:26.772Z</lastmod>',
      '  </url>',
    ].join('\n'));
  });
});
