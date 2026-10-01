/**
 * FAQ 캐시 태그·경로 판정. headnerve `features/faq/faq-cache.ts`를 옮긴 것이다.
 *
 * 웹훅 재검증(`features/cms/revalidation.ts`)이 세 컬렉션을 한 표로 다루므로 화면
 * 보다 먼저(4단계) 들어왔고, `faq-model.ts`·`faq-source.ts`도 같은 판정을 쓴다.
 */
export const FAQ_DATA_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const FAQ_ALL_CACHE_TAG = 'faq:all';
export const FAQ_ARCHIVE_CACHE_TAG = 'faq:archive';

export function isFaqPagePath(pathname: string): boolean {
  return pathname === '/faq' || pathname.startsWith('/faq/');
}

/**
 * FAQ 상세 경로의 내부 참조 키 — `/faq/{section}/{topic}/{slug}`, 또는 진료 영역에
 * 바로 붙은 질문의 `/faq/{section}/{slug}`.
 *
 * headnerve는 같은 계산을 `faq-model.ts`에서 하며 `FAQ_SECTION_SLUGS`(정적 진료
 * 영역 목록)로 1단계 분류를 걸렀다. 이 저장소는 분류를 코드에 두지 않으므로
 * (PLAN.md §4.2) 경로 형태만 본다. 세 조각 경로는 세부 질환 목록일 수도 있지만,
 * CMS가 같은 영역 아래 질환 slug와 질문 slug가 겹치지 않게 막으므로 키는 질문만
 * 가리킨다. 관련 질문·예약 링크의 키와 웹훅의 상세 경로 판정이 같은 규칙을 쓴다.
 */
export function faqInternalLinkKeyFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean).map((segment) => {
    try { return decodeURIComponent(segment); } catch { return segment; }
  });
  if ((segments.length !== 3 && segments.length !== 4) || segments[0] !== 'faq') return null;
  if (segments.some((segment) => !segment)) return null;
  return segments.join('.').toLowerCase();
}
