/**
 * FAQ 캐시 태그·경로 판정. headnerve `features/faq/faq-cache.ts` 그대로다.
 *
 * FAQ 화면 자체는 7단계에서 들어온다. 웹훅 재검증(`features/cms/revalidation.ts`)이
 * 세 컬렉션을 한 표로 다루므로, 4단계에서 이 판정만 먼저 둔다.
 */
export const FAQ_DATA_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const FAQ_ALL_CACHE_TAG = 'faq:all';
export const FAQ_ARCHIVE_CACHE_TAG = 'faq:archive';

export function faqDetailCacheTag(internalKey: string): string {
  return `faq:detail:${internalKey.toLowerCase()}`;
}

export function isFaqPagePath(pathname: string): boolean {
  return pathname === '/faq' || pathname.startsWith('/faq/');
}

/**
 * FAQ 상세 경로(`/faq/{section}/{topic}/{slug}`)의 내부 참조 키.
 *
 * headnerve는 같은 계산을 `faq-model.ts`에서 하며 `FAQ_SECTION_SLUGS`(정적 진료
 * 영역 목록)로 1단계 분류를 걸렀다. 이 저장소는 분류를 코드에 두지 않으므로
 * (PLAN.md §4.2) 4단계 경로 형태만 본다. 존재하지 않는 분류의 키는 캐시 태그가
 * 어디에도 붙어 있지 않아 무효화가 아무것도 건드리지 않는다.
 */
export function faqInternalLinkKeyFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean).map((segment) => {
    try { return decodeURIComponent(segment); } catch { return segment; }
  });
  if (segments.length !== 4 || segments[0] !== 'faq') return null;
  const [, sectionSlug, topicSlug, slug] = segments;
  if (!sectionSlug || !topicSlug || !slug) return null;
  return `faq.${sectionSlug}.${topicSlug}.${slug}`.toLowerCase();
}
