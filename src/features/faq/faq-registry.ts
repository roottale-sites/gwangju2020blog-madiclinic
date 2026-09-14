import {
  faqSectionFallbackDescription,
  faqSectionPageTitle,
  faqTopicFallbackDescription,
} from './faq-content';
import type { FaqArchive, FaqSection, FaqTopic } from './faq-model';
import type { FaqWireCategory } from './faq-wire';

/**
 * 진료 영역(1단계)·세부 질환(2단계) 원장.
 *
 * headnerve는 이 파일에서 질환 콘텐츠(`features/disease/*`·`features/headache/*`)를
 * import해 5개 진료 영역·22개 세부 질환과 검수 FAQ 71건을 정적으로 만들었다. 이
 * 저장소는 분류를 코드에 두지 않는다(PLAN.md §4.2) — 트리는 CMS 모델(`fetchFaqModel`)과
 * 공개 분류 API의 부모·자식 관계에서만 읽고, 여기에는 그 응답을 표시 모델로 바꾸는
 * 순수 함수와 빈 폴백 원장만 남는다.
 */
export type FaqTaxonomy = {
  readonly sections: readonly FaqSection[];
  readonly topics: readonly FaqTopic[];
};

export const EMPTY_FAQ_TAXONOMY: FaqTaxonomy = { sections: [], topics: [] };

/**
 * 폴백 원장은 비어 있다.
 *
 * headnerve는 CMS에 FAQ가 생기기 전 질환 화면의 검수 FAQ를 초기 원장으로 썼다.
 * 이 저장소에는 이관 콘텐츠가 없으므로(PLAN.md §5.3) 폴백은 "아무것도 없음"이고,
 * 화면은 빈 목록이 아니라 이유를 밝히는 안내 문구를 띄운다(`faq-content.faqNotices`).
 */
export const fallbackFaqArchive: FaqArchive = { source: 'fallback', entries: [] };

function sectionFromCategory(category: FaqWireCategory): FaqSection {
  const description = category.description ?? faqSectionFallbackDescription(category.name);
  return {
    slug: category.slug,
    name: category.name,
    description,
    pageTitle: category.seoTitle ?? faqSectionPageTitle(category.name),
    seoDescription: category.seoDescription ?? description,
  };
}

function topicFromCategory(category: FaqWireCategory, sectionSlug: string): FaqTopic {
  const description = category.description ?? faqTopicFallbackDescription(category.name);
  return {
    sectionSlug,
    slug: category.slug,
    name: category.name,
    description,
    pageTitle: category.seoTitle ?? faqSectionPageTitle(category.name),
    seoDescription: category.seoDescription ?? description,
  };
}

/**
 * 공개 분류 응답 → 두 단계 트리.
 *
 * 뿌리(`parentId === null`)가 진료 영역이고 그 직계 자식이 세부 질환이다. 응답
 * 순서를 그대로 지킨다 — 편집자가 ROOT-ADMIN에서 정한 순서가 화면 순서여야 한다.
 * 부모를 찾을 수 없는 분류와 3단계 이하는 네 단계 주소를 만들 수 없어 버린다.
 */
export function faqTaxonomyFromCategories(
  categories: readonly FaqWireCategory[],
): FaqTaxonomy {
  const sectionCategories = categories.filter((category) => category.parentId === null);
  const sectionSlugById = new Map(sectionCategories.map((category) => [category.id, category.slug]));
  const topics = categories.flatMap((category) => {
    if (!category.parentId) return [];
    const sectionSlug = sectionSlugById.get(category.parentId);
    return sectionSlug ? [topicFromCategory(category, sectionSlug)] : [];
  });
  return { sections: sectionCategories.map(sectionFromCategory), topics };
}

export function faqSectionBySlug(taxonomy: FaqTaxonomy, slug: string): FaqSection | undefined {
  return taxonomy.sections.find((section) => section.slug === slug);
}

export function faqTopicBySlug(
  taxonomy: FaqTaxonomy,
  sectionSlug: string,
  topicSlug: string,
): FaqTopic | undefined {
  return taxonomy.topics.find(
    (topic) => topic.sectionSlug === sectionSlug && topic.slug === topicSlug,
  );
}

export function faqTopicsForSection(taxonomy: FaqTaxonomy, sectionSlug: string): FaqTopic[] {
  return taxonomy.topics.filter((topic) => topic.sectionSlug === sectionSlug);
}
