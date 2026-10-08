import type { Metadata } from 'next';
import { clinic } from '../../data/clinic';
import { siteUrl } from '../../data/site';
import { cfImageVariantUrl, isCfImageUrl } from '../cms/cf-image-url';

/** ROOT-ADMIN 검색결과·공유 설정 중 이 사이트가 사용하는 값. */
export type CmsSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  nofollow?: boolean;
};

export function metadataText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** 사이트 상대 주소와 HTTP(S) 이미지만 메타태그에 사용한다. */
export function metadataImageUrl(value: unknown): string | undefined {
  const candidate = metadataText(value);
  if (!candidate || candidate.startsWith('//') || candidate.includes('\\')) return undefined;
  try {
    const url = new URL(candidate.startsWith('/') ? siteUrl(candidate) : candidate);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
    return isCfImageUrl(url.href) ? cfImageVariantUrl(url.href, 'lg') : url.href;
  } catch {
    return undefined;
  }
}

export function readCmsSeo(metaJson: Record<string, unknown>): CmsSeo {
  const seo = metaJson.seo;
  if (!seo || typeof seo !== 'object' || Array.isArray(seo)) return {};
  return {
    title: metadataText(Reflect.get(seo, 'title')),
    description: metadataText(Reflect.get(seo, 'description')),
    ogImage: metadataImageUrl(Reflect.get(seo, 'ogImage')),
    ogImageAlt: metadataText(Reflect.get(seo, 'ogImageAlt')),
    noindex: Reflect.get(seo, 'noindex') === true,
    nofollow: Reflect.get(seo, 'nofollow') === true,
  };
}

export type PageSeo = {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  noindex?: boolean;
  nofollow?: boolean;
};

/** 검색·공유 문구를 함께 생성하며, canonical은 사이트 공개 경로를 유지한다. */
export function pageSeoMetadata(path: string, seo: PageSeo): Metadata {
  const images = seo.imageAlt ? [{ url: seo.imageUrl, alt: seo.imageAlt }] : [seo.imageUrl];
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: path },
    robots: { index: !seo.noindex, follow: !seo.nofollow },
    openGraph: {
      type: 'website', locale: 'ko_KR', siteName: clinic.name,
      title: seo.title, description: seo.description, url: siteUrl(path), images,
    },
    twitter: {
      card: 'summary_large_image', title: seo.title, description: seo.description, images,
    },
  };
}
