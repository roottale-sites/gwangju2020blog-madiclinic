import { resolveMetadata, readMetadataValues } from '@roottale/cms-core';
import { contentMetadataDefaults } from './metadata-contract';
import { buildPageMetadata } from '@roottale/cms-renderer-next/routes';
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
  return resolveMetadata({ overrides: readMetadataValues(metaJson.seo), imageBaseUrl: siteUrl('/') });
}

/** 자동 문구는 배포 계약의 공통 포맷터, 직접 입력은 같은 해석기의 우선값이다. */
export function contentSeo(
  metaJson: Record<string, unknown>,
  input: Parameters<typeof contentMetadataDefaults>[0],
): CmsSeo {
  return resolveMetadata({ overrides: readCmsSeo(metaJson), defaults: contentMetadataDefaults(input) });
}

export type PageSeo = {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  verification?: { routeKey: string; locale: string; version?: string; contractChecksum?: string };
  noindex?: boolean;
  nofollow?: boolean;
};

/** 검색·공유 문구를 함께 생성하며, canonical은 사이트 공개 경로를 유지한다. */
export function pageSeoMetadata(path: string, seo: PageSeo): Metadata {
  const metadata = buildPageMetadata({
    overrides: {
      title: seo.title, description: seo.description, ogImage: seo.imageUrl,
      ogImageAlt: seo.imageAlt, noindex: seo.noindex, nofollow: seo.nofollow,
    },
  }, {
    canonical: path,
    siteUrl: siteUrl('/'),
    path,
    verification: seo.verification,
  });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, locale: 'ko_KR', siteName: clinic.name, url: siteUrl(path) },
  };
}
