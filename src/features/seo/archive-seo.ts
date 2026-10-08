import { fetchPageBySlug } from '@roottale/cms-client/server';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { columnIndexMetadata } from '../column/column-content';
import { faqIndexMetadata } from '../faq/faq-content';
import { reviewsIndexMetadata } from '../reviews/review-content';
import { metadataImageUrl, metadataText, readCmsSeo, type PageSeo } from './cms-metadata';
import { loadDefaultOgImage } from './cms-seo-settings';

export const ARCHIVE_SEO_CACHE_TAG = 'site:archive-seo';
const defaults = { column: columnIndexMetadata, reviews: reviewsIndexMetadata, faq: faqIndexMetadata };
export type ArchiveSeoKey = keyof typeof defaults;

/** 공개 API의 성공 응답만 캐시하고 오류 때 쓰는 기본값은 영속 캐시에 넣지 않는다. */
const fetchArchivePage = unstable_cache(async (key: ArchiveSeoKey) => {
  return fetchPageBySlug({
    apiKey: process.env.ROOTTALE_API_KEY!.trim(),
    baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
    siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim() || undefined,
    slug: key,
    // 이중 캐시를 피하고 위의 태그 하나로 즉시 만료한다.
    revalidate: 0,
    signal: AbortSignal.timeout(5000),
  });
}, ['archive-seo-v1'], { tags: [ARCHIVE_SEO_CACHE_TAG], revalidate: 3600 });

export const loadArchiveSeo = cache(async (key: ArchiveSeoKey): Promise<PageSeo> => {
  const defaultImage = await loadDefaultOgImage();
  const fallback: PageSeo = { ...defaults[key], imageUrl: defaultImage };
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return fallback;
  try {
    const page = await fetchArchivePage(key);
    if (!page) return fallback;
    const seo = readCmsSeo(page.metaJson);
    return {
      title: seo.title ?? metadataText(page.title) ?? fallback.title,
      description: seo.description ?? metadataText(page.excerpt) ?? fallback.description,
      imageUrl: seo.ogImage ?? metadataImageUrl(page.featuredImageUrl) ?? defaultImage,
      imageAlt: seo.ogImage ? seo.ogImageAlt : undefined,
      noindex: seo.noindex,
      nofollow: seo.nofollow,
    };
  } catch {
    console.warn('CMS 목록 메타데이터를 불러오지 못해 기본 문구를 사용합니다.');
    return fallback;
  }
});
