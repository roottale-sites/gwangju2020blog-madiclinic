import { unstable_cache } from 'next/cache';

import { isFaqCmsConfigured, loadFaqCatalog, type FaqLoadFailure } from './faq-api';
import {
  FAQ_ALL_CACHE_TAG,
  FAQ_DATA_CACHE_TTL_SECONDS,
  faqDetailCacheTag,
  faqInternalLinkKeyFromPath,
} from './faq-cache';
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
 * 원장만 필요한 곳(사이트맵·웹훅 역참조 계산)의 얇은 입구.
 * `{ fresh: true }`는 발행 웹훅 전용이다 — 캐시본에는 방금 발행된 글이 없다.
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
 * 상세는 글별 캐시를 쓴다. 웹훅이 상세 태그(`faq:detail:{키}`) 하나만 무효화해도
 * 그 글의 화면이 갱신되어야 하기 때문이다.
 */
function cachedFaqDetail(
  sectionSlug: string,
  topicSlug: string,
  slug: string,
): Promise<FaqDetailCollection> {
  const internalKey = faqInternalLinkKeyFromPath(
    faqEntryPath({ sectionSlug, topicSlug, slug }),
  );
  if (!internalKey) {
    return Promise.resolve(selectFaqDetail(
      { archive: fallbackFaqArchive, taxonomy: EMPTY_FAQ_TAXONOMY, status: 'ok' },
      sectionSlug,
      topicSlug,
      slug,
    ));
  }
  return unstable_cache(
    async () => {
      const result = await loadFaqCatalog();
      if (!result.ok) throw new Error(`FAQ 상세 CMS 조회 실패: ${result.reason}`);
      return selectFaqDetail({ ...result.data, status: 'ok' }, sectionSlug, topicSlug, slug);
    },
    ['faq-detail-v1', internalKey],
    {
      revalidate: FAQ_DATA_CACHE_TTL_SECONDS,
      tags: [FAQ_ALL_CACHE_TAG, faqDetailCacheTag(internalKey)],
    },
  )();
}

/**
 * CMS 장애·미설정이면 `status`가 그 사유를 담고 `entry`는 null이다. 라우트는
 * 상태에 맞는 화면을 고른다 — 없는 글이면 404, 읽을 수 없는 것이면 안내다.
 */
export async function resolveFaqDetailCollection(
  sectionSlug: string,
  topicSlug: string,
  slug: string,
): Promise<FaqDetailCollection> {
  // 비밀값 게이트가 상세 캐시보다 먼저다. 캐시 엔트리는 디스크에 남으므로 키가
  // 있던 실행의 결과가 키 없는 실행에서 되살아나면 안 된다(faq-api 주석 참고).
  if (!isFaqCmsConfigured()) {
    return selectFaqDetail(
      { archive: fallbackFaqArchive, taxonomy: EMPTY_FAQ_TAXONOMY, status: 'unconfigured' },
      sectionSlug,
      topicSlug,
      slug,
    );
  }
  try {
    return await cachedFaqDetail(sectionSlug, topicSlug, slug);
  } catch {
    const collection = await resolveFaqCollection();
    return selectFaqDetail(collection, sectionSlug, topicSlug, slug);
  }
}
