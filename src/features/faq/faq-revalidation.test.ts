import { describe, expect, test } from 'vitest';

import type { FaqEntry } from './faq-model';
import { affectedFaqDetailPaths } from './faq-revalidation';

function entry(slug: string, overrides: Partial<FaqEntry> = {}): FaqEntry {
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

describe('FAQ 선택적 상세 갱신', () => {
  test('변경 글과 예약 키를 참조한 글만 고른다', () => {
    const entries = [
      entry('본문-참조', { referencedContentKeys: ['faq.spine.neck-pain.future'] }),
      entry('관련-참조', { relatedContentKeys: ['faq.spine.neck-pain.future'] }),
      entry('무관한-글'),
    ];

    expect(affectedFaqDetailPaths(entries, {
      paths: ['/faq/spine/neck-pain/future'],
      postId: 'future-id',
    })).toEqual([
      '/faq/spine/neck-pain/future',
      '/faq/spine/neck-pain/본문-참조',
      '/faq/spine/neck-pain/관련-참조',
    ]);
  });

  test('관계 ID 참조도 대상 글 발행취소에 맞춰 갱신한다', () => {
    expect(affectedFaqDetailPaths([
      entry('id-reference', { relatedContentIds: ['target-id'] }),
      entry('other', { relatedContentIds: ['other-id'] }),
    ], {
      paths: ['/faq/spine/neck-pain/target'],
      postId: 'target-id',
    })).toEqual([
      '/faq/spine/neck-pain/target',
      '/faq/spine/neck-pain/id-reference',
    ]);
  });

  test('허브 경로는 상세 갱신 목록에 넣지 않는다', () => {
    expect(affectedFaqDetailPaths([], {
      paths: ['/faq', '/faq/spine', '/faq/spine/neck-pain'],
    })).toEqual([]);
  });

  test('역참조 경로는 플랫폼 원장 경로(path)를 그대로 쓴다', () => {
    expect(affectedFaqDetailPaths([
      entry('참조', {
        path: '/faq/spine/neck-pain/%EC%B0%B8%EC%A1%B0',
        relatedContentKeys: ['faq.spine.neck-pain.future'],
      }),
    ], { paths: ['/faq/spine/neck-pain/future'] })).toEqual([
      '/faq/spine/neck-pain/future',
      '/faq/spine/neck-pain/%EC%B0%B8%EC%A1%B0',
    ]);
  });
});
