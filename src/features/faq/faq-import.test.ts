import { describe, expect, test } from 'vitest';

import type { FaqEntry } from './faq-model';
import {
  buildFaqCmsSeeds,
  planFaqCmsImport,
  type BoundFaqCmsSeed,
  type ManagedFaqPost,
} from './faq-import';

const entry: FaqEntry = {
  sectionSlug: 'headache',
  topicSlug: 'migraine',
  topicName: '편두통',
  slug: '편두통은-왜-재발하나요',
  question: '편두통은 왜 재발하나요?',
  answer: '신경계의 민감도가 남아 있으면 다시 나타날 수 있습니다.',
  intent: '경과와 재발',
  source: 'fallback',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

function managed(seed: BoundFaqCmsSeed, status = 'published'): ManagedFaqPost {
  return {
    id: 'post-1',
    slug: seed.slug,
    status,
    title: seed.title,
    excerpt: seed.excerpt,
    bodyJson: seed.bodyJson,
    fieldValues: seed.fieldValues,
    categoryIds: [seed.categoryId],
  };
}

describe('FAQ 초기 CMS 이관 계획', () => {
  test('질문·핵심 답변·범용 필드와 2단계 분류 경로를 만든다', () => {
    const seed = buildFaqCmsSeeds([entry])[0]!;
    expect(seed).toMatchObject({
      slug: entry.slug,
      title: entry.question,
      excerpt: entry.answer,
      categoryPath: ['headache', 'migraine'],
      fieldValues: {
        classification: '경과와 재발',
        reviewed_at: '2026-08-15',
        display_order: 1,
      },
    });
    expect(seed.bodyJson).toEqual({ type: 'doc', content: [] });
  });

  test('같은 초안은 발행 재개하고 같은 발행 글은 건드리지 않는다', () => {
    const seed = { ...buildFaqCmsSeeds([entry])[0]!, categoryId: 'category-1' };
    expect(planFaqCmsImport([seed], [managed(seed, 'draft')]).publish).toHaveLength(1);
    expect(planFaqCmsImport([seed], [managed(seed)]).unchanged).toHaveLength(1);
  });

  test('관리자가 바꾼 기존 글은 덮어쓰지 않고 충돌로 중단한다', () => {
    const seed = { ...buildFaqCmsSeeds([entry])[0]!, categoryId: 'category-1' };
    const changed = { ...managed(seed), excerpt: '관리자가 수정한 답변' };
    expect(planFaqCmsImport([seed], [changed]).conflicts).toEqual([
      `${entry.slug}: CMS 글이 초기 원장과 다릅니다`,
    ]);
  });

  test('초기 이관 때 핵심 답변을 복제한 상세 본문만 정리 대상으로 잡는다', () => {
    const seed = { ...buildFaqCmsSeeds([entry])[0]!, categoryId: 'category-1' };
    const legacy = {
      ...managed(seed),
      bodyJson: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: entry.answer }] }],
      },
    };

    const plan = planFaqCmsImport([seed], [legacy]);
    expect(plan.normalizeBody).toEqual([legacy]);
    expect(plan.unchanged).toEqual([]);
    expect(plan.conflicts).toEqual([]);
  });

  test('별도로 작성한 상세 답변은 정리하지 않고 충돌로 보호한다', () => {
    const seed = { ...buildFaqCmsSeeds([entry])[0]!, categoryId: 'category-1' };
    const detailed = {
      ...managed(seed),
      bodyJson: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '추가 상세 설명' }] }],
      },
    };

    const plan = planFaqCmsImport([seed], [detailed]);
    expect(plan.normalizeBody).toEqual([]);
    expect(plan.conflicts).toEqual([
      `${entry.slug}: CMS 글이 초기 원장과 다릅니다`,
    ]);
  });

  test('사이트 전체에서 중복될 수 없는 글 slug를 미리 차단한다', () => {
    expect(() => buildFaqCmsSeeds([entry, { ...entry }])).toThrow('중복되는 글 slug');
  });
});
