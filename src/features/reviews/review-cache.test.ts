import { describe, expect, it } from 'vitest';

import {
  REVIEW_ALL_CACHE_TAG,
  REVIEW_ARCHIVE_CACHE_TAG,
  REVIEW_DATA_CACHE_TTL_SECONDS,
  isReviewPagePath,
  reviewDetailCacheTag,
} from './review-cache';

describe('review ISR cache', () => {
  it('후기 목록과 상세 경로만 캐시 대상으로 판정한다', () => {
    expect(isReviewPagePath('/reviews')).toBe(true);
    expect(isReviewPagePath('/reviews/sample')).toBe(true);
    expect(isReviewPagePath('/reviews-old')).toBe(false);
    expect(isReviewPagePath('/')).toBe(false);
  });

  it('목록과 상세가 독립 태그를 쓰고 전역 이벤트용 태그만 공유한다', () => {
    expect(REVIEW_ALL_CACHE_TAG).toBe('reviews:all');
    expect(REVIEW_ARCHIVE_CACHE_TAG).toBe('reviews:archive');
    expect(reviewDetailCacheTag('Sample')).toBe('reviews:detail:sample');
  });

  it('후기 데이터는 24시간 뒤 만료된다', () => {
    expect(REVIEW_DATA_CACHE_TTL_SECONDS).toBe(60 * 60 * 24);
  });
});
