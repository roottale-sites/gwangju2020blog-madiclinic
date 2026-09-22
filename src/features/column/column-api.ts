import { unstable_cache } from 'next/cache';

import {
  COLUMN_ALL_CACHE_TAG,
  COLUMN_ARCHIVE_CACHE_TAG,
  COLUMN_CATEGORIES_CACHE_TAG,
  COLUMN_DATA_CACHE_TTL_SECONDS,
  columnDetailCacheTag,
} from './column-cache';
import { COLUMN_COLLECTION_KEY, isColumnPost } from './column-model';
import {
  fetchColumnPostBySlug,
  fetchColumnPostsPage,
  fetchColumnCategories,
  columnArchivePost,
  type ColumnCategoryWire,
  type ColumnArchivePost,
  type ColumnPost,
  type ColumnWireConfig,
} from './column-wire';

/**
 * 실패 사유를 두 가지로 나눈다. `unconfigured`(비밀값 없음)와 `upstream`(CMS
 * 오류)은 화면이 "지금 불러올 수 없다"는 안내 문구를 띄우는 상태이고, 성공 응답은
 * 비어 있어도 성공이다. ROOT-ADMIN에서 글을 내리면 사이트에서도 사라져야 한다.
 *
 * headnerve는 두 실패에서 이관 JSON 88건으로 되돌아갔다. 이 저장소에는 폴백
 * 콘텐츠가 없으므로(PLAN.md §5.3) 실패는 빈 목록 + 오류 상태로 끝난다.
 */
type ColumnLoadFailure = 'unconfigured' | 'upstream';
export type ColumnLoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: ColumnLoadFailure };

const PAGE_LIMIT = 100;
const MAX_PAGES = 10;

function cmsConfig(): ColumnWireConfig | null {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return null;
  return {
    apiKey,
    baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
  };
}

function logCmsFailure(operation: string, error: unknown): void {
  console.error(
    JSON.stringify({
      message: 'RootTale 칼럼 CMS 요청 실패',
      operation,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}

/**
 * 캐시되는 fetcher는 비밀값을 인자로 받지 않는다.
 *
 * `unstable_cache`는 인자로 캐시 키를 파생시킨다. 설정을 넘기면
 * ROOTTALE_API_KEY가 캐시 키 공간으로 들어간다. 그래서 설정은 캐시 미스
 * 시점에 내부에서 읽는다. 공개 로더가 이미 게이트를 통과시켰으므로
 * 여기서는 설정이 반드시 존재한다.
 */
function requireCmsConfig(): ColumnWireConfig {
  const config = cmsConfig();
  if (!config) throw new Error('ROOTTALE_API_KEY 미설정');
  return config;
}

async function fetchColumnPosts(): Promise<ColumnPost[]> {
  const config = requireCmsConfig();

  const posts: ColumnPost[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchColumnPostsPage(config, {
      collectionKey: COLUMN_COLLECTION_KEY,
      limit: PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    });
    posts.push(...result.items.filter(isColumnPost));
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return posts;
}

async function fetchColumnArchive(): Promise<ColumnArchivePost[]> {
  return (await fetchColumnPosts()).map(columnArchivePost);
}

async function fetchColumnPost(slug: string): Promise<ColumnPost | null> {
  const config = requireCmsConfig();
  const post = await fetchColumnPostBySlug(config, slug);
  return post && isColumnPost(post) ? post : null;
}

async function fetchCategories(): Promise<ColumnCategoryWire[]> {
  return fetchColumnCategories(requireCmsConfig(), COLUMN_COLLECTION_KEY);
}

/**
 * 캐시 래퍼는 설정이 있는 경우에만 불린다.
 *
 * 설정 판정을 캐시 안으로 넣으면, 비밀값이 있던 빌드에서 만들어진 "성공·빈 목록"
 * 엔트리가 런타임 비설정 모드에서도 그대로 되살아나 폴백이 영영 안 동한다.
 * 게이트를 밖으로 빼면 캐시에는 CMS 응답만 남고, 비밀값은 캐시되지 않는다.
 */
const loadCachedColumnArchive = unstable_cache(
  fetchColumnArchive,
  // v1: 이 저장소의 첫 스키마. 캐시 키에 비밀값을 넣지 않는 것이 핵심이다.
  ['column-archive-v1'],
  {
    revalidate: COLUMN_DATA_CACHE_TTL_SECONDS,
    tags: [COLUMN_ALL_CACHE_TAG, COLUMN_ARCHIVE_CACHE_TAG],
  },
);

function loadCachedColumnPost(slug: string): Promise<ColumnPost | null> {
  return unstable_cache(
    () => fetchColumnPost(slug),
    ['column-detail-v1', slug],
    {
      revalidate: COLUMN_DATA_CACHE_TTL_SECONDS,
      tags: [COLUMN_ALL_CACHE_TAG, columnDetailCacheTag(slug)],
    },
  )();
}

const loadCachedColumnCategories = unstable_cache(
  fetchCategories,
  ['column-categories-v1'],
  {
    revalidate: COLUMN_DATA_CACHE_TTL_SECONDS,
    tags: [COLUMN_ALL_CACHE_TAG, COLUMN_CATEGORIES_CACHE_TAG],
  },
);

export async function loadColumnArchive(): Promise<ColumnLoadResult<ColumnArchivePost[]>> {
  if (!cmsConfig()) return { ok: false, reason: 'unconfigured' };
  try {
    return { ok: true, data: await loadCachedColumnArchive() };
  } catch (error) {
    logCmsFailure('archive', error);
    return { ok: false, reason: 'upstream' };
  }
}

export async function loadColumnPost(slug: string): Promise<ColumnLoadResult<ColumnPost | null>> {
  if (!cmsConfig()) return { ok: false, reason: 'unconfigured' };
  try {
    return { ok: true, data: await loadCachedColumnPost(slug) };
  } catch (error) {
    logCmsFailure('detail', error);
    return { ok: false, reason: 'upstream' };
  }
}

export async function loadColumnCategories(): Promise<ColumnLoadResult<ColumnCategoryWire[]>> {
  if (!cmsConfig()) return { ok: false, reason: 'unconfigured' };
  try {
    return { ok: true, data: await loadCachedColumnCategories() };
  } catch (error) {
    logCmsFailure('categories', error);
    return { ok: false, reason: 'upstream' };
  }
}
