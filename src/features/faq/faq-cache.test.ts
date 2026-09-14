import { describe, expect, test } from 'vitest';

import {
  FAQ_ALL_CACHE_TAG,
  FAQ_ARCHIVE_CACHE_TAG,
  FAQ_DATA_CACHE_TTL_SECONDS,
  faqDetailCacheTag,
  faqInternalLinkKeyFromPath,
  isFaqPagePath,
} from './faq-cache';

describe('FAQ 캐시 태그', () => {
  test('안전 캐시는 칼럼·후기와 같은 24시간이다', () => {
    expect(FAQ_DATA_CACHE_TTL_SECONDS).toBe(86400);
    expect([FAQ_ALL_CACHE_TAG, FAQ_ARCHIVE_CACHE_TAG]).toEqual(['faq:all', 'faq:archive']);
  });

  test('상세 태그는 대소문자를 구별하지 않는 예약 키다', () => {
    expect(faqDetailCacheTag('FAQ.Spine.Neck-Pain.MRI-Normal'))
      .toBe('faq:detail:faq.spine.neck-pain.mri-normal');
  });

  test('FAQ 경로만 이 컬렉션의 것으로 본다', () => {
    expect(isFaqPagePath('/faq')).toBe(true);
    expect(isFaqPagePath('/faq/spine/neck-pain/mri-normal')).toBe(true);
    expect(isFaqPagePath('/faqs')).toBe(false);
    expect(isFaqPagePath('/column/spine')).toBe(false);
  });
});

describe('FAQ 예약 키 역변환', () => {
  test('네 단계 상세 경로만 예약 키가 된다', () => {
    expect(faqInternalLinkKeyFromPath('/faq/spine/neck-pain/mri-normal'))
      .toBe('faq.spine.neck-pain.mri-normal');
    expect(faqInternalLinkKeyFromPath('/faq/spine/neck-pain')).toBeNull();
    expect(faqInternalLinkKeyFromPath('/faq')).toBeNull();
    expect(faqInternalLinkKeyFromPath('/column/spine/mri-normal')).toBeNull();
  });

  /**
   * headnerve는 정적 진료 영역 목록으로 1단계 분류를 걸렀다. 이 저장소는 분류를
   * 코드에 두지 않으므로 형태만 본다 — 없는 분류의 키는 캐시 태그가 어디에도 붙어
   * 있지 않아 무효화가 아무것도 건드리지 않는다.
   */
  test('분류를 모르는 경로도 형태가 맞으면 키를 만든다', () => {
    expect(faqInternalLinkKeyFromPath('/faq/아직-없는-영역/질환/질문'))
      .toBe('faq.아직-없는-영역.질환.질문');
  });

  test('인코딩된 한글 경로도 같은 키로 되돌린다', () => {
    expect(faqInternalLinkKeyFromPath('/faq/spine/neck-pain/%EA%B2%80%EC%82%AC'))
      .toBe('faq.spine.neck-pain.검사');
  });
});
