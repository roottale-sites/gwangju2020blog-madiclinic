import type { CmsPostContent } from '@roottale/cms-client/server';

import { siteUrl } from '../../data/site';
import { buildRssFeedXml } from '../seo/rss-xml';
import { reviewsIndexMetadata } from './review-content';
import { reviewEntryLoc } from './review-sitemap';
import {
  reviewImageUrl,
  reviewMetadata,
  reviewSeoDescription,
  reviewTitle,
} from './review-model';

export const REVIEW_RSS_PATH = '/reviews/rss.xml';
/** 후기에 도판이 없을 때 쓰는 기본 이미지. 본 사이트 헤더 로고다. */
const REVIEW_RSS_FALLBACK_IMAGE_PATH = '/madi/img/hi_gwangju2020_20240826.png';

function newestFirst(posts: readonly CmsPostContent[]): CmsPostContent[] {
  return [...posts].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function imageMimeType(url: string): string {
  const pathname = new URL(url, siteUrl('/')).pathname.toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function reviewImageEnclosureUrl(imageUrl: string | null): string {
  if (!imageUrl) return siteUrl(REVIEW_RSS_FALLBACK_IMAGE_PATH);
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) return siteUrl(imageUrl);

  try {
    const url = new URL(imageUrl);
    return url.protocol === 'https:' ? url.toString() : siteUrl(REVIEW_RSS_FALLBACK_IMAGE_PATH);
  } catch {
    return siteUrl(REVIEW_RSS_FALLBACK_IMAGE_PATH);
  }
}

function reviewRssItem(post: CmsPostContent) {
  const imageUrl = reviewImageEnclosureUrl(reviewImageUrl(post));
  const metadata = reviewMetadata(post);

  return {
    title: reviewTitle(post),
    link: reviewEntryLoc(post),
    description: reviewSeoDescription(post),
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: metadata.doctor,
    category: metadata.category,
    enclosure: { url: imageUrl, type: imageMimeType(imageUrl) },
  };
}

/** 현재 공개된 치료후기 목록으로 RSS 2.0 피드를 만든다. */
export function buildReviewRssXml(posts: readonly CmsPostContent[]): string {
  return buildRssFeedXml({
    title: reviewsIndexMetadata.title,
    link: siteUrl('/reviews'),
    description: reviewsIndexMetadata.description,
    selfUrl: siteUrl(REVIEW_RSS_PATH),
    language: 'ko-KR',
    items: newestFirst(posts).map(reviewRssItem),
  });
}
