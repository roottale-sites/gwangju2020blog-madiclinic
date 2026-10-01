import { isFaqCmsConfigured, loadFaqCatalog, type FaqLoadFailure } from './faq-api';
import { faqInternalLinkKeyFromPath } from './faq-cache';
import {
  faqEntryPath,
  relatedFaqEntries,
  type FaqArchive,
  type FaqEntry,
} from './faq-model';
import { EMPTY_FAQ_TAXONOMY, fallbackFaqArchive, type FaqTaxonomy } from './faq-registry';

/**
 * 출처 경계.
 *
 * CMS 응답이 **성공**이면 그 결과가 곧 진실이다. 글 목록이 비어 있어도 비어 있는
 * 것이고, 분류가 0건이면 아직 아무 영역도 만들지 않은 것이다. ROOT-ADMIN에서 글을
 * 내린 결과가 사이트에 그대로 반영되어야 한다.
 *
 * headnerve는 `unconfigured`·`no-model`·`upstream` 세 실패에서 질환 화면의 검수 FAQ
 * 71건으로 되돌아갔다. 이 저장소에는 폴백 콘텐츠가 없으므로(PLAN.md §5.3) 같은 세
 * 경우를 `status`로 알리고 화면이 안내 문구를 띄운다(칼럼 `column-source.ts`와 같은
 * 판정). 그래서 실패 사유를 `no-model`까지 구분해 내보낸다.
 */
export type FaqSourceStatus = 'ok' | FaqLoadFailure;

export type FaqCollection = {
  readonly archive: FaqArchive;
  readonly taxonomy: FaqTaxonomy;
  readonly status: FaqSourceStatus;
};

export async function resolveFaqCollection(
  options: { readonly fresh?: boolean } = {},
): Promise<FaqCollection> {
  const result = await loadFaqCatalog(options);
  if (!result.ok) {
    return { archive: fallbackFaqArchive, taxonomy: EMPTY_FAQ_TAXONOMY, status: result.reason };
  }
  return { ...result.data, status: 'ok' };
}

/**
 * 사이트맵·RSS처럼 원장만 필요한 곳의 입구. 웹훅은 CMS를 조회하지 않는다.
 */
export async function resolveFaqArchive(
  options: { readonly fresh?: boolean } = {},
): Promise<FaqArchive> {
  return (await resolveFaqCollection(options)).archive;
}

export type FaqDetailCollection = FaqCollection & { readonly entry: FaqEntry | null };

function selectFaqDetail(
  collection: FaqCollection,
  sectionSlug: string,
  topicSlug: string,
  slug: string,
): FaqDetailCollection {
  const entry = collection.archive.entries.find((candidate) =>
    candidate.sectionSlug === sectionSlug &&
    candidate.topicSlug === topicSlug &&
    candidate.slug === slug,
  ) ?? null;
  if (!entry) return { ...collection, archive: { ...collection.archive, entries: [] }, entry: null };
  const related = relatedFaqEntries(collection.archive.entries, entry);
  return {
    ...collection,
    archive: { ...collection.archive, entries: [entry, ...related] },
    entry,
  };
}

/**
 * 목록과 상세가 같은 공용 원장을 읽는다. 상세 사본을 별도로 캐시하면 자동 추천·
 * ID 관계·예약 링크의 변경을 빠짐없이 역추적해야 한다. 중첩 unstable_cache는
 * 내부 캐시 조회도 우회하므로 상세마다 CMS 전체를 다시 읽는 비용이 발생한다.
 *
 * FAQ 라우트는 force-dynamic이다. 웹훅이 공용 원장 하나를 만료하면 다음 요청에서
 * 최신 데이터로 상세와 관계를 선택하며, 다른 상세 방문도 갱신된 원장을 재사용한다.
 */
export async function resolveFaqDetailCollection(
  sectionSlug: string,
  topicSlug: string,
  slug: string,
): Promise<FaqDetailCollection> {
  if (!isFaqCmsConfigured()) {
    return selectFaqDetail(
      { archive: fallbackFaqArchive, taxonomy: EMPTY_FAQ_TAXONOMY, status: 'unconfigured' },
      sectionSlug, topicSlug, slug,
    );
  }
  const internalKey = faqInternalLinkKeyFromPath(
    faqEntryPath({ sectionSlug, topicSlug, slug }),
  );
  if (!internalKey) {
    return selectFaqDetail(
      { archive: fallbackFaqArchive, taxonomy: EMPTY_FAQ_TAXONOMY, status: 'ok' },
      sectionSlug,
      topicSlug,
      slug,
    );
  }
  const collection = await resolveFaqCollection();
  return selectFaqDetail(collection, sectionSlug, topicSlug, slug);
}
