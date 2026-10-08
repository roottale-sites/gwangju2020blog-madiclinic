import { fetchRedirects, type RootTaleRedirect } from '@roottale/cms-client/server';
import { filterMetadataSitemapEntries, normalizeRedirectPath } from '@roottale/cms-renderer-next/routes';
import { cache } from 'react';
import { metadataRoute, metadataRoutePath } from './metadata-contract';
import { loadRouteSeo } from './route-seo';
import type { CmsSeo } from './cms-metadata';

export type SitemapMetadataContext = {
  metadata: ReadonlyMap<string, CmsSeo | undefined>;
  redirects: readonly RootTaleRedirect[];
};

const loadRedirects = cache(async (): Promise<RootTaleRedirect[]> => {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return [];
  try {
    return await fetchRedirects({
      apiKey,
      baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
      siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim() || undefined,
      revalidate: 60,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.warn('주소 이동 목록을 읽지 못해 확인 가능한 사이트맵 경로를 유지합니다.');
    return [];
  }
});

/** 글은 이미 읽은 SEO를 재사용하고, 본문 없는 화면만 키로 직접 조회한다. */
export async function loadSitemapMetadata(routeKeys: readonly string[]): Promise<SitemapMetadataContext> {
  const [entries, redirects] = await Promise.all([
    Promise.all(routeKeys.map(async (key): Promise<[string, CmsSeo]> => {
      const seo = await loadRouteSeo(key);
      return [metadataRoutePath(metadataRoute(key)), { noindex: seo.noindex, nofollow: seo.nofollow }];
    })),
    loadRedirects(),
  ]);
  return { metadata: new Map(entries), redirects };
}

export function mergeSitemapMetadata(
  context: SitemapMetadataContext | undefined,
  entries: Iterable<readonly [string, CmsSeo | undefined]>,
): SitemapMetadataContext {
  return { metadata: new Map([...(context?.metadata ?? []), ...[...entries].map(([path, seo]) => [normalizeRedirectPath(path), seo] as const)]), redirects: context?.redirects ?? [] };
}

export function filterSitemapUrls<T extends { loc: string }>(
  entries: readonly T[],
  context?: SitemapMetadataContext,
): T[] {
  return filterMetadataSitemapEntries(
    entries.map((entry) => ({ value: entry, url: entry.loc })),
    (entry) => ({ metadata: { overrides: context?.metadata.get(normalizeRedirectPath(new URL(entry.url).pathname)) } }),
    { redirects: context?.redirects },
  ).map((entry) => entry.value);
}
