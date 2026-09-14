import { faqInternalLinkKeyFromPath } from './faq-cache';

/**
 * FAQ 표시 모델. headnerve `features/faq/faq-model.ts`를 옮긴 것이다.
 *
 * headnerve와 다르게 한 곳
 *   - `FAQ_SECTION_SLUGS`(진료 영역 5개 상수)와 `FaqSectionSlug`·`isFaqSectionSlug`를
 *     걷어냈다. 진료 영역(1단계)·세부 질환(2단계)은 CMS 모델·공개 분류 API의 부모·
 *     자식 관계에서만 읽고 코드에는 분류 slug를 두지 않는다(PLAN.md §4.2).
 *     그래서 `sectionSlug`·`topicSlug`는 그냥 문자열이고, 없는 분류는 "존재하지 않는
 *     주소"로 라우트에서 404가 된다.
 *   - `FaqSection`·`FaqTopic`에서 headnerve 질환 도판(`imageSrc`·`imageAlt`)과 질환
 *     페이지 링크(`diseasePath`)를 뺐다. 이 저장소에는 질환 라우트도 도판도 없다.
 *   - 예약 키 → 경로 역변환(`faqInternalLinkKeyFromPath`)은 `faq-cache.ts`가 소유한다.
 *     웹훅 재검증(4단계)이 FAQ 화면보다 먼저 그 판정을 썼고, 두 벌을 두면 갈라진다.
 *
 * 4단계 경로 계산·`faqEntryPath`·예약 링크·관련 콘텐츠 로직은 headnerve 그대로다.
 */
export type FaqSource = 'cms' | 'fallback';

export const FAQ_INTENTS = [
  '증상과 원인',
  '검사와 진단',
  '치료와 병행',
  '경과와 재발',
  '생활 관리',
] as const;

export type FaqIntent = (typeof FAQ_INTENTS)[number];

/** 진료 영역(1단계 분류). 이름·설명·SEO 문구는 모두 CMS 분류에서 온다. */
export type FaqSection = {
  slug: string;
  name: string;
  description: string;
  pageTitle: string;
  seoDescription: string;
};

/** 세부 질환(2단계 분류). */
export type FaqTopic = {
  sectionSlug: string;
  slug: string;
  name: string;
  description: string;
  pageTitle: string;
  seoDescription: string;
};

export type FaqEntry = {
  contentId?: string;
  sectionSlug: string;
  topicSlug: string;
  topicName: string;
  slug: string;
  /**
   * 플랫폼이 저장한 정규 공개 경로(ADR-0105). 링크·canonical·사이트맵은 이 값을
   * 읽고, 없을 때만 영역·질환·slug로 조립한다.
   */
  path?: string | null;
  /** ROOT-ADMIN 주소 이동 이력의 옛 slug — 옛 키로 남은 관련·본문 예약을 현재 글로 잇는다. */
  previousSlugs?: readonly string[];
  question: string;
  answer: string;
  bodyHtml?: string;
  clinicPerspectiveHtml?: string;
  relatedContentIds?: readonly string[];
  relatedContentKeys?: readonly string[];
  referencedContentKeys?: readonly string[];
  questionContext?: string;
  reviewedAt?: string;
  displayOrder?: number;
  intent: FaqIntent;
  source: FaqSource;
  updatedAt: string;
};

export type FaqArchive = {
  source: FaqSource;
  entries: readonly FaqEntry[];
};

export function cleanFaqQuestion(value: string): string {
  return value.replace(/^\s*Q[.．:]?\s*/iu, '').replace(/\[\[br(?::[^\]]+)?\]\]/gu, ' ').replace(/\s+/gu, ' ').trim();
}

export function cleanFaqAnswer(value: string): string {
  return value.replace(/^\s*A[.．:]?\s*/iu, '').replace(/\[\[br(?::[^\]]+)?\]\]/gu, ' ').replace(/\s+/gu, ' ').trim();
}

function normalizedVisibleText(value: string): string {
  return value
    .replace(/<[^>]*>/gu, ' ')
    .replace(/&nbsp;|&#160;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\s+/gu, ' ')
    .trim();
}

/** 핵심 답변을 그대로 넣은 본문은 상세 답변으로 중복 표시하지 않는다. */
export function detailedFaqBodyHtml(answer: string, bodyHtml: string): string | undefined {
  const normalizedHtml = normalizedVisibleText(bodyHtml);
  return normalizedHtml && normalizedHtml !== cleanFaqAnswer(answer) ? bodyHtml : undefined;
}

export function faqQuestionSlug(question: string): string {
  const normalized = cleanFaqQuestion(question)
    .normalize('NFKC')
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/gu, '-');
  return normalized.slice(0, 72).replace(/-+$/u, '') || 'question';
}

/**
 * 질문 성격. 화면 필터와 목록 묶음에만 쓰고 URL에는 넣지 않는다.
 *
 * headnerve는 두통·어지럼증 진료의 낱말(MRI·리리카·미드론 등)을 봤다. 여기서는
 * 같은 다섯 갈래를 유지하면서 마디클리닉 진료(통증중재시술·도수치료·인대증식술)의
 * 낱말로 바꿨다. 판정 순서는 그대로다 — 앞선 갈래가 이긴다.
 */
export function faqIntentForQuestion(question: string): FaqIntent {
  const value = cleanFaqQuestion(question);
  if (/(검사|MRI|CT|초음파|엑스레이|X-?ray|진단|정상|판독)/iu.test(value)) return '검사와 진단';
  if (/(병행|같이|함께|약|주사|시술|수술|도수|물리치료|진통제|소염제|스테로이드|마취)/iu.test(value)) return '치료와 병행';
  if (/(얼마나|기간|횟수|재발|자연|낫|좋아질|회복|완치|호전|부작용)/iu.test(value)) return '경과와 재발';
  if (/(생활|운동|스트레칭|자세|식사|수면|업무|일상|습관)/iu.test(value)) return '생활 관리';
  return '증상과 원인';
}

export function faqSectionPath(sectionSlug: string): string {
  return `/faq/${sectionSlug}`;
}

export function faqTopicPath(sectionSlug: string, topicSlug: string): string {
  return `${faqSectionPath(sectionSlug)}/${topicSlug}`;
}

export type FaqEntryPathInput = Pick<FaqEntry, 'sectionSlug' | 'topicSlug' | 'slug'> &
  Partial<Pick<FaqEntry, 'path'>>;

/**
 * FAQ 상세 주소. 플랫폼 원장(`entry.path`)을 먼저 읽고, 없을 때만 영역·질환·slug로
 * 조립한다(ADR-0105 Amendment 1 — FRONT는 주소를 다시 계산하지 않는다).
 */
export function faqEntryPath(entry: FaqEntryPathInput): string {
  return entry.path ?? `${faqTopicPath(entry.sectionSlug, entry.topicSlug)}/${entry.slug}`;
}

/** 예약 본문 링크가 URL과 독립적으로 참조하는 FAQ 공개 식별자. */
export function faqInternalLinkKey(
  entry: Pick<FaqEntry, 'sectionSlug' | 'topicSlug' | 'slug'>,
): string {
  return `faq.${entry.sectionSlug}.${entry.topicSlug}.${entry.slug}`.toLowerCase();
}

export { faqInternalLinkKeyFromPath };

/**
 * 현재 발행 원장에 실제로 존재하는 예약 키만 공개 경로와 연결한다.
 *
 * 글의 옛 slug(`previousSlugs`, ROOT-ADMIN 주소 이동 이력)로 만든 키도 같은 글의
 * *현재* 경로로 등록한다 — 주소가 바뀐 뒤에도 옛 키로 남은 본문·관련 키가 새 주소로
 * 렌더된다. 현재 slug 키가 우선이라 옛 slug를 다른 글이 재사용해도 그 글이 이긴다.
 */
export function faqPublishedInternalLinkPaths(
  entries: readonly (FaqEntryPathInput & {
    previousSlugs?: readonly string[];
  })[],
): ReadonlyMap<string, string> {
  const paths = new Map<string, string>();
  for (const entry of entries) {
    const currentPath = faqEntryPath(entry);
    for (const previousSlug of entry.previousSlugs ?? []) {
      const key = faqInternalLinkKey({ ...entry, slug: previousSlug });
      if (!paths.has(key)) paths.set(key, currentPath);
    }
  }
  for (const entry of entries) paths.set(faqInternalLinkKey(entry), faqEntryPath(entry));
  return paths;
}

const FAQ_INTERNAL_CONTENT_KEY_PATTERN =
  /^faq\.([a-z0-9가-힣-]+)\.([a-z0-9가-힣-]+)\.([a-z0-9가-힣-]+)$/iu;

/**
 * ROOT-ADMIN "공개 FAQ 선택"(relationship) 값에서 글 ID를 읽는다.
 *
 * 공개 API는 관계 필드를 `{ id, title, slug, type }` 객체로 풀어 주고(발행 글만),
 * 옛 응답·원시 저장값은 ID 문자열 배열이다 — 두 모양을 모두 받는다.
 */
export function faqRelatedContentIds(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = typeof item === 'string'
      ? item
      : item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'
        ? (item as { id: string }).id
        : '';
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    ids.push(trimmed);
    if (ids.length === 5) break;
  }
  return ids;
}

/**
 * ROOT-ADMIN 여러 줄 입력에서 유효하고 중복 없는 FAQ 예약 키를 최대 5개 읽는다.
 *
 * headnerve는 여기서 1단계 분류를 정적 목록(`FAQ_SECTION_SLUGS`)으로 걸렀다. 이
 * 저장소는 분류를 코드에 두지 않으므로 키의 *형태*만 본다. 없는 분류를 가리키는
 * 키는 발행 원장에 대응하는 글이 없어 화면·본문 링크에서 그대로 숨는다.
 */
export function faqRelatedContentKeys(value: unknown): readonly string[] {
  if (typeof value !== 'string') return [];
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value.split(/[\s,]+/u)) {
    const key = candidate.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (!FAQ_INTERNAL_CONTENT_KEY_PATTERN.test(key)) continue;
    seen.add(key);
    keys.push(key);
    if (keys.length === 5) break;
  }
  return keys;
}

/**
 * 관리자가 고른 관계 ID와 미래 예약 키를 현재 공개 FAQ 원장에 대조한다.
 * 명시 설정이 하나라도 있으면 미발행 항목은 숨기고 자동 추천으로 대체하지 않는다.
 */
export function relatedFaqEntries(
  entries: readonly FaqEntry[],
  current: FaqEntry,
): readonly FaqEntry[] {
  const relatedIds = current.relatedContentIds ?? [];
  const relatedKeys = current.relatedContentKeys ?? [];
  if (relatedIds.length === 0 && relatedKeys.length === 0) {
    return entriesForTopic(entries, current.sectionSlug, current.topicSlug)
      .filter((candidate) => candidate.slug !== current.slug)
      .slice(0, 3);
  }

  const byId = new Map(
    entries.flatMap((candidate) => candidate.contentId
      ? [[candidate.contentId, candidate] as const]
      : []),
  );
  // 옛 slug 키도 현재 글로 잇는다(현재 slug 키 우선 — faqPublishedInternalLinkPaths와 같은 규칙).
  const byKey = new Map<string, FaqEntry>();
  for (const candidate of entries) {
    for (const previousSlug of candidate.previousSlugs ?? []) {
      const key = faqInternalLinkKey({ ...candidate, slug: previousSlug });
      if (!byKey.has(key)) byKey.set(key, candidate);
    }
  }
  for (const candidate of entries) byKey.set(faqInternalLinkKey(candidate), candidate);
  const selected = [
    ...relatedIds.flatMap((contentId) => byId.get(contentId) ?? []),
    ...relatedKeys.flatMap((key) => byKey.get(key) ?? []),
  ];
  const currentKey = faqInternalLinkKey(current);
  const seen = new Set<string>();
  return selected.filter((candidate) => {
    const key = faqInternalLinkKey(candidate);
    if (key === currentKey || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

export function entriesForSection(entries: readonly FaqEntry[], sectionSlug: string): FaqEntry[] {
  return entries.filter((entry) => entry.sectionSlug === sectionSlug);
}

export function entriesForTopic(entries: readonly FaqEntry[], sectionSlug: string, topicSlug: string): FaqEntry[] {
  return entries.filter((entry) => entry.sectionSlug === sectionSlug && entry.topicSlug === topicSlug);
}
