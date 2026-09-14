import { describe, expect, test } from 'vitest';

import { faqCategory, faqFixtureCategories } from './faq-fixture';
import {
  EMPTY_FAQ_TAXONOMY,
  fallbackFaqArchive,
  faqSectionBySlug,
  faqTaxonomyFromCategories,
  faqTopicBySlug,
  faqTopicsForSection,
} from './faq-registry';

const taxonomy = faqTaxonomyFromCategories(faqFixtureCategories);

describe('FAQ 분류 트리', () => {
  /**
   * headnerve는 여기서 질환 콘텐츠를 import해 5개 진료 영역·22개 세부 질환을 코드에
   * 갖고 있었다. 이 저장소에는 분류 slug가 하나도 없어야 한다(PLAN.md §4.2).
   */
  test('폴백 원장은 비어 있다 — 코드에 분류도 질문도 없다', () => {
    expect(fallbackFaqArchive).toEqual({ source: 'fallback', entries: [] });
    expect(EMPTY_FAQ_TAXONOMY).toEqual({ sections: [], topics: [] });
  });

  test('뿌리 분류가 진료 영역, 직계 자식이 세부 질환이며 응답 순서를 지킨다', () => {
    expect(taxonomy.sections.map((section) => section.slug)).toEqual(['spine', 'joint']);
    expect(taxonomy.topics.map((topic) => `${topic.sectionSlug}/${topic.slug}`))
      .toEqual(['spine/neck-pain', 'spine/disc', 'joint/knee']);
  });

  test('이름·설명·SEO 문구는 CMS 분류 값을 그대로 쓴다', () => {
    expect(faqSectionBySlug(taxonomy, 'spine')).toEqual({
      slug: 'spine',
      name: '척추 통증',
      description: '목·허리 통증에 관해 자주 받는 질문입니다.',
      pageTitle: '척추 통증 자주 묻는 질문',
      seoDescription: '목·허리 통증의 검사와 비수술 치료 질문을 확인하세요.',
    });
  });

  test('문구가 비어 있으면 이름을 끼운 서식으로 채운다', () => {
    const topic = faqTopicBySlug(taxonomy, 'spine', 'neck-pain');
    expect(topic?.pageTitle).toBe('목 통증 자주 묻는 질문');
    expect(topic?.description).toContain('목 통증');
    expect(topic?.seoDescription).toBe(topic?.description);
  });

  test('부모를 찾을 수 없는 분류와 3단계는 네 단계 주소를 만들 수 없어 버린다', () => {
    const tree = faqTaxonomyFromCategories([
      faqCategory({ id: 's1', parentId: null, slug: 'spine', name: '척추 통증' }),
      faqCategory({ id: 't1', parentId: 's1', slug: 'neck-pain', name: '목 통증' }),
      faqCategory({ id: 'x1', parentId: 't1', slug: 'deeper', name: '3단계' }),
      faqCategory({ id: 'x2', parentId: '없는-부모', slug: 'orphan', name: '부모 없음' }),
    ]);
    expect(tree.sections.map((section) => section.slug)).toEqual(['spine']);
    expect(tree.topics.map((topic) => topic.slug)).toEqual(['neck-pain']);
  });

  test('분류 0건이면 트리가 비어 있고 조회는 undefined다', () => {
    const empty = faqTaxonomyFromCategories([]);
    expect(empty).toEqual({ sections: [], topics: [] });
    expect(faqSectionBySlug(empty, 'spine')).toBeUndefined();
    expect(faqTopicBySlug(taxonomy, 'spine', '없는-질환')).toBeUndefined();
    expect(faqTopicsForSection(taxonomy, '없는-영역')).toEqual([]);
  });

  test('세부 질환은 영역별로 나뉜다', () => {
    expect(faqTopicsForSection(taxonomy, 'spine').map((topic) => topic.slug))
      .toEqual(['neck-pain', 'disc']);
    expect(faqTopicsForSection(taxonomy, 'joint').map((topic) => topic.slug)).toEqual(['knee']);
  });
});
