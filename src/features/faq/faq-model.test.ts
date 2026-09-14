import { describe, expect, test } from 'vitest';

import {
  cleanFaqAnswer,
  cleanFaqQuestion,
  detailedFaqBodyHtml,
  entriesForSection,
  entriesForTopic,
  faqEntryPath,
  faqInternalLinkKey,
  faqIntentForQuestion,
  faqPublishedInternalLinkPaths,
  faqQuestionSlug,
  faqRelatedContentIds,
  faqRelatedContentKeys,
  faqSectionPath,
  faqTopicPath,
  relatedFaqEntries,
  type FaqEntry,
} from './faq-model';
import { faqFixtureEntries } from './faq-fixture';

function faqEntry(slug: string, overrides: Partial<FaqEntry> = {}): FaqEntry {
  return {
    sectionSlug: 'spine',
    topicSlug: 'neck-pain',
    topicName: '목 통증',
    slug,
    question: `${slug} 질문`,
    answer: '답변',
    intent: '증상과 원인',
    source: 'cms',
    updatedAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('FAQ 표시 모델', () => {
  test('Q/A 접두어와 조판 마커만 제거한다', () => {
    expect(cleanFaqQuestion('Q. MRI가 [[br:pc]]정상인데 맞나요?')).toBe('MRI가 정상인데 맞나요?');
    expect(cleanFaqAnswer('A. 네. [[br]]함께 확인합니다.')).toBe('네. 함께 확인합니다.');
  });

  test('한국어 질문을 안정된 읽기 URL로 바꾼다', () => {
    expect(faqQuestionSlug('Q. MRI가 정상인데 목이 아플 수 있나요?')).toBe('mri가-정상인데-목이-아플-수-있나요');
  });

  test('네 단계 주소는 분류 slug를 그대로 잇는다', () => {
    expect(faqSectionPath('spine')).toBe('/faq/spine');
    expect(faqTopicPath('spine', 'neck-pain')).toBe('/faq/spine/neck-pain');
    expect(faqEntryPath({ sectionSlug: 'spine', topicSlug: 'neck-pain', slug: '검사가-정상인가요' }))
      .toBe('/faq/spine/neck-pain/검사가-정상인가요');
  });

  test('플랫폼 원장 경로(path)가 있으면 조립하지 않고 그대로 쓴다 (ADR-0105)', () => {
    const entry = {
      sectionSlug: 'spine',
      topicSlug: 'neck-pain',
      slug: '검사가-정상인가요',
      path: '/faq/spine/neck-pain/%EA%B2%80%EC%82%AC%EA%B0%80-%EC%A0%95%EC%83%81%EC%9D%B8%EA%B0%80%EC%9A%94',
    };
    expect(faqEntryPath(entry)).toBe(entry.path);
    expect(faqEntryPath({ ...entry, path: null })).toBe('/faq/spine/neck-pain/검사가-정상인가요');
    expect(faqPublishedInternalLinkPaths([entry]).get('faq.spine.neck-pain.검사가-정상인가요'))
      .toBe(entry.path);
  });

  test('예약 내부 링크 키와 현재 공개 경로를 같은 주소 계약에서 계산한다', () => {
    const entry = { sectionSlug: 'spine', topicSlug: 'neck-pain', slug: 'mri-normal' };
    expect(faqInternalLinkKey(entry)).toBe('faq.spine.neck-pain.mri-normal');
    expect(faqPublishedInternalLinkPaths([entry]).get('faq.spine.neck-pain.mri-normal'))
      .toBe('/faq/spine/neck-pain/mri-normal');
  });

  test('옛 slug로 만든 키도 현재 경로로 해석하되 현재 slug 키가 우선한다', () => {
    const moved = faqEntry('mri-normal');
    const paths = faqPublishedInternalLinkPaths([
      { ...moved, previousSlugs: ['mri', 'mri-old'] },
      // 다른 글이 옛 slug 'mri'를 지금 쓰고 있다면 그 글이 이긴다.
      faqEntry('mri'),
    ]);
    expect(paths.get('faq.spine.neck-pain.mri-old')).toBe('/faq/spine/neck-pain/mri-normal');
    expect(paths.get('faq.spine.neck-pain.mri')).toBe('/faq/spine/neck-pain/mri');
    expect(paths.get('faq.spine.neck-pain.mri-normal')).toBe('/faq/spine/neck-pain/mri-normal');
  });

  test('질문 성격은 URL이 아닌 필터 값으로만 계산하며 마디클리닉 진료 낱말을 본다', () => {
    expect(faqIntentForQuestion('MRI가 정상인데 아플 수 있나요?')).toBe('검사와 진단');
    expect(faqIntentForQuestion('주사 치료와 먹는 약을 병행해도 되나요?')).toBe('치료와 병행');
    expect(faqIntentForQuestion('치료 기간은 얼마나 걸리나요?')).toBe('경과와 재발');
    expect(faqIntentForQuestion('어떤 자세로 일해야 하나요?')).toBe('생활 관리');
    expect(faqIntentForQuestion('허리가 왜 아픈가요?')).toBe('증상과 원인');
  });

  test('핵심 답변을 그대로 넣은 본문은 상세 답변으로 중복하지 않는다', () => {
    expect(detailedFaqBodyHtml('같은 답변입니다.', '<p>같은 답변입니다.</p>')).toBeUndefined();
    expect(detailedFaqBodyHtml('핵심 답변', '<p>더 자세한 설명입니다.</p>'))
      .toBe('<p>더 자세한 설명입니다.</p>');
  });

  /**
   * headnerve는 여기서 예약 키의 1단계를 정적 진료 영역 목록으로 걸렀다. 이
   * 저장소는 분류를 코드에 두지 않으므로 형태만 본다.
   */
  test('관련 콘텐츠 여러 줄 입력에서 형태가 맞는 키만 중복 없이 읽는다', () => {
    expect(faqRelatedContentKeys([
      'FAQ.SPINE.NECK-PAIN.future-one',
      'faq.spine.neck-pain.future-one',
      '잘못된-key',
      'faq.아직-없는-영역.질환.future-two',
      'faq.spine.neck-pain.future-three',
    ].join('\n'))).toEqual([
      'faq.spine.neck-pain.future-one',
      'faq.아직-없는-영역.질환.future-two',
      'faq.spine.neck-pain.future-three',
    ]);
    expect(faqRelatedContentKeys(undefined)).toEqual([]);
  });

  test('공개 FAQ 선택 값은 관계 객체와 ID 문자열을 모두 글 ID로 읽는다', () => {
    expect(faqRelatedContentIds([
      { id: 'post-a', title: 'A 질문', slug: 'a', type: 'post' },
      'post-b',
      { id: 'post-a', title: '중복', slug: 'a', type: 'post' },
      { title: 'id 없음' },
      42,
      ' ',
    ])).toEqual(['post-a', 'post-b']);
    expect(faqRelatedContentIds('post-a')).toEqual([]);
    expect(faqRelatedContentIds(undefined)).toEqual([]);
  });

  test('관리자가 고른 공개 FAQ는 ID로 현재 원장과 맞춰 노출한다', () => {
    const picked = faqEntry('picked', { contentId: 'post-picked' });
    const current = faqEntry('current', {
      contentId: 'post-current',
      relatedContentIds: ['post-picked', 'post-current', 'post-unpublished'],
    });
    const automaticCandidate = faqEntry('automatic', { contentId: 'post-automatic' });

    expect(relatedFaqEntries([current, automaticCandidate, picked], current)).toEqual([picked]);
  });

  test('옛 slug로 남은 예약 키도 주소가 바뀐 현재 글로 잇는다', () => {
    const current = faqEntry('current', { relatedContentKeys: ['faq.spine.neck-pain.old-slug'] });
    const moved = faqEntry('new-slug', { previousSlugs: ['old-slug'] });

    expect(relatedFaqEntries([current, moved], current)).toEqual([moved]);
  });

  test('예약 관련 FAQ는 공개된 대상만 노출하고 미발행 자리를 자동 추천으로 바꾸지 않는다', () => {
    const current = faqEntry('current', { relatedContentKeys: ['faq.spine.neck-pain.future'] });
    const automaticCandidate = faqEntry('automatic');

    expect(relatedFaqEntries([current, automaticCandidate], current)).toEqual([]);

    const publishedFuture = faqEntry('future');
    expect(relatedFaqEntries([current, automaticCandidate, publishedFuture], current))
      .toEqual([publishedFuture]);
  });

  test('명시 설정이 없으면 같은 세부 질환의 다른 질문 3건을 자동 추천한다', () => {
    const current = faqFixtureEntries[0]!;
    expect(relatedFaqEntries(faqFixtureEntries, current).map((entry) => entry.slug))
      .toEqual(['desk-posture']);
  });

  test('영역·질환별로 원장을 나눈다', () => {
    expect(entriesForSection(faqFixtureEntries, 'spine')).toHaveLength(3);
    expect(entriesForTopic(faqFixtureEntries, 'spine', 'neck-pain')).toHaveLength(2);
    expect(entriesForSection(faqFixtureEntries, '없는-영역')).toEqual([]);
  });
});
