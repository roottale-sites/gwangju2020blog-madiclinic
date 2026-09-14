import {
  COLUMN_ALL_CACHE_TAG,
  COLUMN_ARCHIVE_CACHE_TAG,
  columnDetailCacheTag,
  isColumnPagePath,
} from '../column/column-cache';
import {
  FAQ_ALL_CACHE_TAG,
  FAQ_ARCHIVE_CACHE_TAG,
  faqDetailCacheTag,
  faqInternalLinkKeyFromPath,
  isFaqPagePath,
} from '../faq/faq-cache';
import {
  REVIEW_ALL_CACHE_TAG,
  REVIEW_ARCHIVE_CACHE_TAG,
  isReviewPagePath,
  reviewDetailCacheTag,
} from '../reviews/review-cache';

export type RevalidationPayload = {
  readonly paths: string[];
  readonly postId?: string;
  readonly modelKey?: string;
};

function safePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (path): path is string =>
      typeof path === 'string' && path.startsWith('/') && !path.startsWith('//'),
  );
}

/** 서명 검증 뒤 사용할 글 경로와 역참조 식별자를 읽는다. */
export function readRevalidationPayload(rawBody: string): RevalidationPayload | null {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object') return null;
    const paths = safePaths(Reflect.get(parsed, 'paths'));
    const rawPostId = Reflect.get(parsed, 'postId');
    const rawModelKey = Reflect.get(parsed, 'modelKey');
    return {
      paths,
      ...(typeof rawPostId === 'string' && rawPostId.trim()
        ? { postId: rawPostId.trim() }
        : {}),
      ...(typeof rawModelKey === 'string' && rawModelKey.trim()
        ? { modelKey: rawModelKey.trim() }
        : {}),
    };
  } catch {
    return null;
  }
}

/**
 * ROOT-ADMIN 웹훅 본문에서 안전한 절대 경로만 읽는다.
 *
 * 프로토콜 상대 경로(`//attacker.example`)는 절대 URL로 해석될 수 있으므로 거른다.
 */
export function readRevalidationPaths(rawBody: string): string[] | null {
  return readRevalidationPayload(rawBody)?.paths ?? null;
}

/**
 * 사이트 전체에 영향을 주는 이벤트. 분류(taxonomy)와 테마가 바뀌면 어떤 경로가
 * 왔든 두 컬렉션을 모두 다시 만든다.
 */
export function isSiteWideEvent(event: string): boolean {
  return event === 'theme.updated' || event === 'taxonomy.updated';
}

function decodedSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean).map((segment) => {
    try { return decodeURIComponent(segment); } catch { return segment; }
  });
}

function detailCacheTagsFor(target: RevalidationTarget, paths: readonly string[]): string[] {
  const tags = paths.flatMap((pathname) => {
    const segments = decodedSegments(pathname);
    if (target === 'reviews' && segments.length === 2 && segments[0] === 'reviews') {
      return reviewDetailCacheTag(segments[1]!);
    }
    if (target === 'column' && segments.length === 3 && segments[0] === 'column') {
      return columnDetailCacheTag(segments[2]!);
    }
    if (target === 'faq') {
      const key = faqInternalLinkKeyFromPath(pathname);
      return key ? faqDetailCacheTag(key) : [];
    }
    return [];
  });
  return [...new Set(tags)];
}

const TARGET_TAGS: Record<
  RevalidationTarget,
  { readonly all: string; readonly archive: string }
> = {
  reviews: { all: REVIEW_ALL_CACHE_TAG, archive: REVIEW_ARCHIVE_CACHE_TAG },
  column: { all: COLUMN_ALL_CACHE_TAG, archive: COLUMN_ARCHIVE_CACHE_TAG },
  faq: { all: FAQ_ALL_CACHE_TAG, archive: FAQ_ARCHIVE_CACHE_TAG },
};

/** 글 이벤트는 목록과 영향받은 상세만, 사이트 전역 이벤트는 해당 컬렉션 전체를 갱신한다. */
export function revalidationTagsFor(
  target: RevalidationTarget,
  event: string,
  paths: readonly string[],
): string[] {
  const tags = TARGET_TAGS[target];
  if (isSiteWideEvent(event)) return [tags.all];
  return [tags.archive, ...detailCacheTagsFor(target, paths)];
}

export type RevalidationTarget = 'reviews' | 'column' | 'faq';

const MODEL_TARGETS: Readonly<Record<string, RevalidationTarget>> = {
  reviews: 'reviews',
  column: 'column',
  faq: 'faq',
};

/** 공개 콘텐츠 모델이 반드시 포함해야 하는 사이트 갱신 대상. */
export function revalidationTargetForModel(
  modelKey: string | undefined,
): RevalidationTarget | null {
  return modelKey ? MODEL_TARGETS[modelKey] ?? null : null;
}

/** 이 이벤트가 갱신해야 할 컬렉션들. 없으면 무시해도 되는 웹훅이다. */
export function revalidationTargets(
  event: string,
  paths: readonly string[],
): RevalidationTarget[] {
  const siteWide = isSiteWideEvent(event);
  const targets: RevalidationTarget[] = [];
  if (siteWide || paths.some(isReviewPagePath)) targets.push('reviews');
  if (siteWide || paths.some(isColumnPagePath)) targets.push('column');
  if (siteWide || paths.some(isFaqPagePath)) targets.push('faq');
  return targets;
}

export function shouldRevalidate(event: string, paths: readonly string[]): boolean {
  return revalidationTargets(event, paths).length > 0;
}

/**
 * 컬렉션별로 항상 무효화해야 하는 고정 경로.
 *
 * 후기·칼럼은 목록 외에 사이트맵·RSS 라우트도 같은 24시간 캐시를 쓴다. 이걸 빼면
 * ROOT-ADMIN에서 새 글을 발행해도 하루 동안 구독 피드에 안 나타날 수 있다.
 */
const TARGET_FIXED_PATHS: Record<RevalidationTarget, readonly string[]> = {
  reviews: ['/reviews', '/reviews-sitemap.xml', '/reviews/rss.xml', '/sitemap.xml'],
  column: ['/column', '/column-sitemap.xml', '/column/rss.xml', '/sitemap.xml'],
  faq: ['/faq', '/faq-sitemap.xml', '/sitemap.xml'],
};

/**
 * 실제로 무효화할 경로 목록. 고정 경로는 항상 포함하고, 웹훅이 준 상세
 * 경로 중 해당 컬렉션에 속한 것만 더한다.
 */
export function revalidationPathsFor(
  target: RevalidationTarget,
  paths: readonly string[],
): string[] {
  const belongs = target === 'reviews'
    ? isReviewPagePath
    : target === 'column'
      ? isColumnPagePath
      : isFaqPagePath;
  return [...new Set([...TARGET_FIXED_PATHS[target], ...paths.filter(belongs)])];
}
