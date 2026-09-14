import type { CmsPostContent } from '@roottale/cms-client/server';

import { siteUrl } from '../../data/site';
import {
  buildSitemapUrlSetXml,
  latestSitemapLastModified,
} from '../seo/sitemap-xml';
import { reviewEntryPath, type ReviewPathInput } from './review-model';

export type ReviewSitemapEntry = Pick<
  CmsPostContent,
  'slug' | 'publishedAt' | 'updatedAt'
> & ReviewPathInput;

/** 후기가 없거나 CMS를 일시적으로 읽지 못할 때 쓰는 목록 기준 수정일. */
export const REVIEW_ARCHIVE_LASTMOD = '2026-09-15T00:00:00.000Z';

export function reviewEntryLoc(review: ReviewPathInput): string {
  return siteUrl(reviewEntryPath(review));
}

function reviewLastModifiedAt(review: ReviewSitemapEntry): string {
  return review.updatedAt?.trim() || review.publishedAt;
}

/** 후기 목록과 사이트맵 인덱스가 공유하는 가장 최근 콘텐츠 수정일. */
export function reviewSitemapLastModified(reviews: readonly ReviewSitemapEntry[]): string {
  return latestSitemapLastModified(
    reviews.map(reviewLastModifiedAt),
    REVIEW_ARCHIVE_LASTMOD,
  );
}

export function buildReviewSitemapXml(reviews: readonly ReviewSitemapEntry[]): string {
  const archiveLastModified = reviewSitemapLastModified(reviews);

  return buildSitemapUrlSetXml([
    { loc: siteUrl('/reviews'), lastmod: archiveLastModified },
    ...reviews.map((review) => ({
      loc: reviewEntryLoc(review),
      lastmod: reviewLastModifiedAt(review),
    })),
  ]);
}
