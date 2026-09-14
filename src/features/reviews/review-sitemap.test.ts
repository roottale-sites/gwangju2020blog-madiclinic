import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { siteOrigin } from '../../data/site';
import { REVIEW_DATA_CACHE_TTL_SECONDS } from './review-cache';
import {
  buildReviewSitemapXml,
  REVIEW_ARCHIVE_LASTMOD,
  reviewEntryLoc,
  reviewSitemapLastModified,
  type ReviewSitemapEntry,
} from './review-sitemap';

function review(overrides: Partial<ReviewSitemapEntry> = {}): ReviewSitemapEntry {
  return {
    slug: '무릎-치료후기',
    publishedAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T11:00:00.000Z',
    ...overrides,
  };
}

describe('후기 사이트맵', () => {
  test('CMS 후기 상세 URL과 목록 URL을 함께 싣는다', () => {
    const xml = buildReviewSitemapXml([review()]);

    expect(xml).toContain(`<loc>${siteOrigin}/reviews</loc>`);
    expect(xml).toContain(`<loc>${reviewEntryLoc({ slug: '무릎-치료후기' })}</loc>`);
    expect(xml).toContain('<lastmod>2026-09-15T11:00:00.000Z</lastmod>');
  });

  test('한글 슬러그를 퍼센트 인코딩한다', () => {
    expect(reviewEntryLoc({ slug: '무릎-치료후기' })).toBe(
      `${siteOrigin}/reviews/${encodeURIComponent('무릎-치료후기')}`,
    );
  });

  test('플랫폼이 저장한 정규 공개 경로(path)가 있으면 그대로 싣는다 (ADR-0105)', () => {
    const xml = buildReviewSitemapXml([review({ path: '/reviews/%EB%AC%B4%EB%A6%8E-2026' })]);
    expect(xml).toContain(`<loc>${siteOrigin}/reviews/%EB%AC%B4%EB%A6%8E-2026</loc>`);
    expect(reviewEntryLoc({ slug: 'x', path: '/reviews/x-2026' })).toBe(`${siteOrigin}/reviews/x-2026`);
  });

  test('후기가 없으면 목록 URL만 남긴다', () => {
    const xml = buildReviewSitemapXml([]);

    expect([...xml.matchAll(/<loc>/g)]).toHaveLength(1);
    expect(xml).toContain(`<loc>${siteOrigin}/reviews</loc>`);
    expect(xml).toContain(`<lastmod>${REVIEW_ARCHIVE_LASTMOD}</lastmod>`);
  });

  test('후기 목록과 인덱스는 가장 최근 콘텐츠 수정일만 갱신한다', () => {
    expect(reviewSitemapLastModified([
      review({ updatedAt: '2026-09-15T12:00:00.000Z' }),
      review({ updatedAt: '2026-09-15T13:00:00.000Z' }),
    ])).toBe('2026-09-15T13:00:00.000Z');
  });

  test('라우트는 후기 캐시 주기와 실패 시 503 계약을 지킨다', () => {
    const route = readFileSync(
      join(process.cwd(), 'src/app/reviews-sitemap.xml/route.ts'),
      'utf8',
    );

    expect(route).toContain(`export const revalidate = ${REVIEW_DATA_CACHE_TTL_SECONDS};`);
    expect(route).toContain('status: 503');
    expect(route).toContain("'retry-after': '300'");
  });
});
