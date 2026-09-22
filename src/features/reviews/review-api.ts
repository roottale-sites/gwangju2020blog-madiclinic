import {
  fetchPost,
  fetchPosts,
  type CmsPostContent,
} from '@roottale/cms-client/server';
import { unstable_cache } from 'next/cache';

import {
  REVIEW_ALL_CACHE_TAG,
  REVIEW_ARCHIVE_CACHE_TAG,
  REVIEW_DATA_CACHE_TTL_SECONDS,
  reviewDetailCacheTag,
} from './review-cache';
import { isReviewPost, REVIEW_COLLECTION_KEY } from './review-model';

type ReviewLoadFailure = 'unconfigured' | 'upstream';
export type ReviewLoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: ReviewLoadFailure };

const PAGE_LIMIT = 100;
const MAX_PAGES = 10;

function cmsConfig(): { apiKey: string; baseUrl: string } | null {
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
      message: 'RootTale 후기 CMS 요청 실패',
      operation,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}

function requireCmsConfig() {
  const config = cmsConfig();
  if (!config) throw new Error('ROOTTALE_API_KEY 미설정');
  return config;
}

// 캐시에는 정상 응답만 저장한다. 설정·장애 판정은 공개 로더가 처리한다.
async function fetchReviewArchive(): Promise<CmsPostContent[]> {
  const config = requireCmsConfig();
  const reviews: CmsPostContent[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchPosts({
      ...config,
      type: 'post',
      collectionKey: REVIEW_COLLECTION_KEY,
      limit: PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    });
    reviews.push(...result.items.filter(isReviewPost));
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return reviews;
}

async function fetchReview(slug: string): Promise<CmsPostContent | null> {
  const post = await fetchPost({ ...requireCmsConfig(), slugOrId: slug });
  return post && isReviewPost(post) ? post : null;
}

const loadCachedReviewArchive = unstable_cache(
  fetchReviewArchive,
  ['reviews-archive-v2'],
  {
    revalidate: REVIEW_DATA_CACHE_TTL_SECONDS,
    tags: [REVIEW_ALL_CACHE_TAG, REVIEW_ARCHIVE_CACHE_TAG],
  },
);

function loadCachedReview(slug: string): Promise<CmsPostContent | null> {
  return unstable_cache(
    () => fetchReview(slug),
    ['review-detail-v2', slug],
    {
      revalidate: REVIEW_DATA_CACHE_TTL_SECONDS,
      tags: [REVIEW_ALL_CACHE_TAG, reviewDetailCacheTag(slug)],
    },
  )();
}

export async function loadReviewArchive(): Promise<ReviewLoadResult<CmsPostContent[]>> {
  if (!cmsConfig()) return { ok: false, reason: 'unconfigured' };
  try {
    return { ok: true, data: await loadCachedReviewArchive() };
  } catch (error) {
    logCmsFailure('archive', error);
    return { ok: false, reason: 'upstream' };
  }
}

export async function loadReview(slug: string): Promise<ReviewLoadResult<CmsPostContent | null>> {
  if (!cmsConfig()) return { ok: false, reason: 'unconfigured' };
  try {
    return { ok: true, data: await loadCachedReview(slug) };
  } catch (error) {
    logCmsFailure('detail', error);
    return { ok: false, reason: 'upstream' };
  }
}
