import type { FaqEntry, FaqIntent } from './faq-model';
import { faqTaxonomyFromCategories } from './faq-registry';
import type { FaqCollection } from './faq-source';
import type { FaqWireCategory } from './faq-wire';

/**
 * 테스트용 CMS 분류·글 픽스처.
 *
 * headnerve 테스트는 정적 초기 원장(검수 FAQ 71건)을 그대로 단정했다. 이 저장소는
 * 분류·글을 전부 CMS에서 읽으므로(PLAN.md §4.2) 화면·사이트맵·목차 테스트가 쓸
 * 분류 트리를 여기서 만든다. 진료 영역 2개·세부 질환 3개·발행 글 4건이다.
 *
 * 이름·slug는 테스트 전용 값이다. 제품 코드에는 분류가 없다.
 */
export function faqCategory(
  partial: Pick<FaqWireCategory, 'id' | 'parentId' | 'slug' | 'name'> &
    Partial<Pick<FaqWireCategory, 'description' | 'seoTitle' | 'seoDescription' | 'collectionKey'>>,
): FaqWireCategory {
  return {
    collectionKey: 'faq',
    description: null,
    seoTitle: null,
    seoDescription: null,
    ...partial,
  };
}

export const faqFixtureCategories: readonly FaqWireCategory[] = [
  faqCategory({
    id: 'sec-spine',
    parentId: null,
    slug: 'spine',
    name: '척추 통증',
    description: '목·허리 통증에 관해 자주 받는 질문입니다.',
    seoTitle: '척추 통증 자주 묻는 질문',
    seoDescription: '목·허리 통증의 검사와 비수술 치료 질문을 확인하세요.',
  }),
  faqCategory({ id: 'top-neck', parentId: 'sec-spine', slug: 'neck-pain', name: '목 통증' }),
  faqCategory({ id: 'top-disc', parentId: 'sec-spine', slug: 'disc', name: '허리 디스크' }),
  faqCategory({ id: 'sec-joint', parentId: null, slug: 'joint', name: '관절 통증' }),
  faqCategory({ id: 'top-knee', parentId: 'sec-joint', slug: 'knee', name: '무릎 관절' }),
];

function faqFixtureEntry(
  partial: Pick<FaqEntry, 'sectionSlug' | 'topicSlug' | 'topicName' | 'slug' | 'question' | 'answer'> &
    Partial<FaqEntry> & { intent: FaqIntent },
): FaqEntry {
  return {
    source: 'cms',
    updatedAt: '2026-09-15T00:00:00.000Z',
    ...partial,
  };
}

export const faqFixtureEntries: readonly FaqEntry[] = [
  faqFixtureEntry({
    contentId: 'post-neck-mri',
    sectionSlug: 'spine',
    topicSlug: 'neck-pain',
    topicName: '목 통증',
    slug: 'mri-normal',
    question: 'MRI가 정상인데 목이 계속 아플 수 있나요?',
    answer: '영상에서 큰 이상이 없어도 근육·인대·관절의 문제로 통증이 남을 수 있습니다.',
    intent: '검사와 진단',
  }),
  faqFixtureEntry({
    contentId: 'post-neck-life',
    sectionSlug: 'spine',
    topicSlug: 'neck-pain',
    topicName: '목 통증',
    slug: 'desk-posture',
    question: '사무직인데 어떤 자세로 일해야 하나요?',
    answer: '화면을 눈높이에 두고 한 시간마다 일어나 목·어깨를 펴 주세요.',
    intent: '생활 관리',
  }),
  faqFixtureEntry({
    contentId: 'post-disc-shot',
    sectionSlug: 'spine',
    topicSlug: 'disc',
    topicName: '허리 디스크',
    slug: 'injection-with-medicine',
    question: '주사 치료와 먹는 약을 같이 해도 되나요?',
    answer: '함께 쓰는 경우가 많지만 복용 중인 약을 알려 주시면 조절해 드립니다.',
    intent: '치료와 병행',
  }),
  faqFixtureEntry({
    contentId: 'post-knee-period',
    sectionSlug: 'joint',
    topicSlug: 'knee',
    topicName: '무릎 관절',
    slug: 'how-long',
    question: '치료 기간은 얼마나 걸리나요?',
    answer: '통증의 원인과 기간에 따라 다르며 첫 진료에서 예상 경과를 함께 정합니다.',
    intent: '경과와 재발',
  }),
];

export function faqFixtureCollection(
  overrides: Partial<FaqCollection> = {},
): FaqCollection {
  return {
    archive: { source: 'cms', entries: faqFixtureEntries },
    taxonomy: faqTaxonomyFromCategories(faqFixtureCategories),
    status: 'ok',
    ...overrides,
  };
}
