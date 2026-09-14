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

async function fetchReviewArchive(): Promise<ReviewLoadResult<CmsPostContent[]>> {
  const config = cmsConfig();
  if (!config) return { ok: false, reason: 'unconfigured' };

  try {
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
    return { ok: true, data: reviews };
  } catch (error) {
    logCmsFailure('archive', error);
    return { ok: false, reason: 'upstream' };
  }
}

async function fetchReview(slug: string): Promise<ReviewLoadResult<CmsPostContent | null>> {
  const config = cmsConfig();
  if (!config) return { ok: false, reason: 'unconfigured' };

  try {
    const post = await fetchPost({ ...config, slugOrId: slug });
    const review = post && isReviewPost(post) ? post : null;
    return { ok: true, data: review };
  } catch (error) {
    logCmsFailure('detail', error);
    return { ok: false, reason: 'upstream' };
  }
}

const loadCachedReviewArchive = unstable_cache(
  fetchReviewArchive,
  ['reviews-archive-v1'],
  {
    revalidate: REVIEW_DATA_CACHE_TTL_SECONDS,
    tags: [REVIEW_ALL_CACHE_TAG, REVIEW_ARCHIVE_CACHE_TAG],
  },
);

function loadCachedReview(slug: string): Promise<ReviewLoadResult<CmsPostContent | null>> {
  return unstable_cache(
    () => fetchReview(slug),
    ['review-detail-v1', slug],
    {
      revalidate: REVIEW_DATA_CACHE_TTL_SECONDS,
      tags: [REVIEW_ALL_CACHE_TAG, reviewDetailCacheTag(slug)],
    },
  )();
}

export async function loadReviewArchive(): Promise<ReviewLoadResult<CmsPostContent[]>> {
  return loadCachedReviewArchive();
}

export async function loadReview(slug: string): Promise<ReviewLoadResult<CmsPostContent | null>> {
  return loadCachedReview(slug);
}
