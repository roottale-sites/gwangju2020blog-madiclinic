import { BLOG_SETTINGS_CACHE_TAG, fetchBlogSettings } from '@roottale/cms-client/server';
import { cache } from 'react';
import { metadataImageUrl } from './cms-metadata';
import { DEFAULT_OG_IMAGE_URL } from './og-image';

/** ROOT-ADMIN 설정 → 검색 노출의 공통 공유 이미지. 오류 본문에는 시크릿이 있을 수 있다. */
export const loadDefaultOgImage = cache(async (): Promise<string> => {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return DEFAULT_OG_IMAGE_URL;
  try {
    const settings = await fetchBlogSettings({
      apiKey,
      baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
      siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim() || undefined,
      tags: [BLOG_SETTINGS_CACHE_TAG],
      revalidate: 3600,
      signal: AbortSignal.timeout(5000),
    });
    return metadataImageUrl(settings.siteProfile.defaultOgImageUrl) ?? DEFAULT_OG_IMAGE_URL;
  } catch {
    console.warn('CMS 공통 공유 이미지를 불러오지 못해 기본 이미지를 사용합니다.');
    return DEFAULT_OG_IMAGE_URL;
  }
});
