import contract from '../../../cms/site-content-contract.json';
import { fetchRouteMetadata, metadataContractChecksum, resolveMetadata } from '@roottale/cms-client/server';
import { cache } from 'react';
import { metadataRoute, metadataRouteForPath } from './metadata-contract';
import { pageSeoMetadata, type PageSeo } from './cms-metadata';
import { loadSiteMetadataDefaults } from './cms-seo-settings';
import { siteOrigin } from '../../data/site';

let checksum: Promise<string> | undefined;
const contractChecksum = () => checksum ??= metadataContractChecksum(contract);

/** SDK가 성공 응답의 키·태그·TTL을 소유한다. 오류 폴백을 영속 캐시에 저장하지 않는다. */
export const loadRouteSeo = cache(async (routeKey: string): Promise<PageSeo> => {
  const route = metadataRoute(routeKey);
  const siteDefaults = await loadSiteMetadataDefaults();
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  let metadata = null;
  if (apiKey && apiKey !== 'local_unconfigured') {
    try {
      metadata = await fetchRouteMetadata({
        apiKey,
        baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
        siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim() || undefined,
        routeKey,
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      console.warn('CMS 메타데이터를 불러오지 못해 페이지 기본값을 사용합니다.');
    }
  }
  const values = resolveMetadata({
    overrides: metadata?.overrides,
    defaults: route.defaults,
    siteDefaults,
    fallback: route.fallback,
    robots: metadata?.robots,
    imageBaseUrl: siteOrigin,
  });
  return {
    title: values.title ?? route.defaults.title,
    description: values.description ?? route.defaults.description,
    imageUrl: values.ogImage ?? route.fallback.ogImage,
    imageAlt: values.ogImageAlt,
    noindex: values.noindex,
    nofollow: values.nofollow,
    verification: { routeKey, locale: metadata?.locale ?? 'ko', version: metadata?.version, contractChecksum: await contractChecksum() },
  };
});

export async function routePageMetadata(path: string) {
  return pageSeoMetadata(path, await loadRouteSeo(metadataRouteForPath(path).routeKey));
}
