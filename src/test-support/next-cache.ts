import 'next/dist/server/node-environment-baseline';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IncrementalCache } from 'next/dist/server/lib/incremental-cache';
import { nodeFs } from 'next/dist/server/lib/node-fs-methods';
import { createWorkStore } from 'next/dist/server/async-storage/work-store';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { createPatchedFetcher } from 'next/dist/server/lib/patch-fetch';

/** Next의 실제 캐시를 메모리에서 실행한다. 디스크·운영 CMS에는 쓰지 않는다. */
export function nextCacheFixture() {
  const id = randomUUID();
  const preview = { previewModeId: id, previewModeEncryptionKey: '', previewModeSigningKey: '' };
  const cache = new IncrementalCache({
    fs: nodeFs,
    dev: false,
    flushToDisk: false,
    serverDistDir: join(tmpdir(), `faq-cache-${id}`),
    fetchCacheKeyPrefix: id,
    maxMemoryCacheSize: 5 * 1024 * 1024,
    requestHeaders: {},
    previewProps: preview,
    prerenderManifest: {
      version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [],
      preview,
    },
  });

  async function request<T>(run: () => Promise<T>, page = '/faq/page'): Promise<T> {
    const store = createWorkStore({
      page, buildId: id, deploymentId: id, previouslyRevalidatedTags: [],
      renderOpts: {
        incrementalCache: cache,
        cacheLifeProfiles: { default: { stale: 300, revalidate: 900, expire: 86400 } },
        staticPageGenerationTimeout: 60,
        cacheComponents: false, validationLevel: 'warning',
        assetPrefix: '', isDraftMode: false,
        isBuildTimePrerendering: false, isDebugDynamicAccesses: false,
        experimental: { isRoutePPREnabled: false, authInterrupts: false, useCacheTimeout: 60, durableUseCacheEntries: false },
        waitUntil: undefined, onClose: () => {}, onAfterTaskError: undefined,
      },
    });
    const value = await workAsyncStorage.run(store, run);
    await Promise.all(Object.values(store.pendingRevalidates ?? {}));
    for (const { tag, profile } of store.pendingRevalidatedTags ?? []) {
      if (typeof profile === 'string') throw new Error('이 fixture는 즉시 만료만 지원합니다.');
      await cache.revalidateTag(tag, profile);
    }
    return value;
  }

  const cachedFetch = (originFetch: typeof fetch) => createPatchedFetcher(originFetch, { workAsyncStorage, workUnitAsyncStorage });
  return { request, cache, cachedFetch };
}
