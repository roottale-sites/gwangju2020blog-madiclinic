import { describe, expect, test } from 'vitest';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { siteOrigin } from '../../data/site';
import { COLUMN_DATA_CACHE_TTL_SECONDS } from './column-cache';
import {
  buildColumnSitemapXml,
  COLUMN_ARCHIVE_LASTMOD,
  columnEntryLoc,
  columnSitemapLastModified,
} from './column-sitemap';
import type { ColumnArchiveEntry } from './column-model';
import type { ColumnCategory } from './column-category';

/**
 * headnerve `column-sitemap.test.ts`를 이 저장소 픽스처로 다시 쓴 것이다. 88건
 * 원장을 세던 테스트만 개수 계약으로 바꿨고 나머지 계약(분류 허브 자동 포함,
 * 분류별 실제 수정일, 인코딩, 라우트 주기)은 그대로다.
 */
const categories: readonly ColumnCategory[] = [{
  slug: 'knee',
  name: '무릎',
  path: '/column/knee',
  description: '무릎 통증 글',
  seoTitle: '무릎 통증',
  seoDescription: '무릎 통증',
  publishedPostCount: 1,
}];

function entry(overrides: Partial<ColumnArchiveEntry> = {}): ColumnArchiveEntry {
  return {
    slug: 'knee-pain',
    title: '새 글',
    description: '설명',
    publishedAt: '2026-09-15T18:00:00+09:00',
    updatedAt: '2026-09-15T19:00:00+09:00',
    category: { slug: 'knee', name: '무릎', path: '/column/knee' },
    ...overrides,
  };
}

describe('칼럼 사이트맵', () => {
  test('ROOT-ADMIN이 새로 발행한 슬러그가 사이트맵에 들어간다', () => {
    const xml = buildColumnSitemapXml([entry({ slug: 'brand-new-post' })], categories);

    expect(xml).toContain(`<loc>${siteOrigin}/column/knee/brand-new-post</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/column/knee</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/column</loc>`);
  });

  test('분류 API 반영이 늦어도 발행 글의 새 분류 허브를 자동 포함한다', () => {
    const xml = buildColumnSitemapXml([
      entry({
        slug: 'spine-guide',
        category: { slug: 'spine', name: '척추', path: '/column/spine' },
      }),
    ], []);

    expect(xml).toContain(`<loc>${siteOrigin}/column/spine</loc>`);
    expect(xml).toContain(`<loc>${siteOrigin}/column/spine/spine-guide</loc>`);
  });

  test('분류 허브마다 그 분류의 실제 최신 글 수정일을 쓴다', () => {
    const xml = buildColumnSitemapXml([
      entry({ updatedAt: '2026-09-15T20:00:00+09:00' }),
      entry({
        slug: 'shoulder-post',
        updatedAt: '2026-09-15T18:30:00+09:00',
        category: { slug: 'shoulder', name: '어깨', path: '/column/shoulder' },
      }),
    ], [
      ...categories,
      { ...categories[0]!, slug: 'shoulder', name: '어깨', path: '/column/shoulder' },
    ]);

    expect(xml).toContain(
      `<loc>${siteOrigin}/column/knee</loc><lastmod>2026-09-15T20:00:00+09:00</lastmod>`,
    );
    expect(xml).toContain(
      `<loc>${siteOrigin}/column/shoulder</loc><lastmod>2026-09-15T18:30:00+09:00</lastmod>`,
    );
  });

  test('목록 1개 + 분류 허브 + 글 주소를 한 번씩만 만든다', () => {
    const xml = buildColumnSitemapXml([entry({ slug: 'a' }), entry({ slug: 'b' })], categories);

    // 목록 1 + 분류 1 + 글 2
    expect([...xml.matchAll(/<loc>/g)]).toHaveLength(4);
  });

  test('한글 슬러그를 퍼센트 인코딩해 내보낸다', () => {
    const article = entry({ slug: '무릎-통증' });
    const xml = buildColumnSitemapXml([article], categories);

    expect(xml).toContain(`<loc>${siteOrigin}/column/knee/${encodeURIComponent('무릎-통증')}</loc>`);
    expect(columnEntryLoc(article)).toBe(
      `${siteOrigin}/column/knee/${encodeURIComponent('무릎-통증')}`,
    );
  });

  test('유효한 urlset XML 뼈대를 만든다', () => {
    const xml = buildColumnSitemapXml([entry()], categories);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  test('CMS 수정일을 lastmod로 싣는다', () => {
    expect(buildColumnSitemapXml([entry()], categories))
      .toContain('<lastmod>2026-09-15T19:00:00+09:00</lastmod>');
  });

  test('수정일이 없는 글은 발행일을 lastmod로 쓴다', () => {
    expect(buildColumnSitemapXml([entry({ updatedAt: undefined })], categories))
      .toContain('<lastmod>2026-09-15T18:00:00+09:00</lastmod>');
  });

  test('글이 없으면 목록 주소만 남는다', () => {
    const xml = buildColumnSitemapXml([], []);

    expect(xml).toContain(`<loc>${siteOrigin}/column</loc>`);
    expect([...xml.matchAll(/<loc>/g)]).toHaveLength(1);
    expect(xml).toContain(`<lastmod>${COLUMN_ARCHIVE_LASTMOD}</lastmod>`);
  });

  test('칼럼 목록과 인덱스는 가장 최근 콘텐츠 수정일만 갱신한다', () => {
    expect(columnSitemapLastModified([
      entry({ updatedAt: '2026-09-15T21:00:00+09:00' }),
      entry({ updatedAt: '2026-09-15T22:00:00+09:00' }),
    ])).toBe('2026-09-15T22:00:00+09:00');
  });

  test('XML 특수문자를 이스케이프한다', () => {
    const xml = buildColumnSitemapXml([entry({ slug: 'a&b' })], categories);

    expect(xml).not.toMatch(/<loc>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
  });

  test('배포 오리진만 쓰고 임시 호스트를 쓰지 않는다', () => {
    const xml = buildColumnSitemapXml([entry()], categories);

    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      expect(loc?.startsWith(`${siteOrigin}/`)).toBe(true);
    }
    expect(xml).not.toContain('preview.example.test');
  });

  test('사이트맵 라우트의 revalidate 리터럴이 칼럼 TTL과 같다', () => {
    // 세그먼트 설정은 정적 리터럴이어야 해서 상수를 import 할 수 없다.
    // 둘이 갈라지면 사이트맵만 다른 주기로 달라져 조용히 어긋난다.
    const route = readFileSync(join(process.cwd(), 'src/app/column-sitemap.xml/route.ts'), 'utf8');

    expect(route).toContain(`export const revalidate = ${COLUMN_DATA_CACHE_TTL_SECONDS};`);
  });
});
