import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

type CacheCallback = (...args: string[]) => Promise<unknown>;

type CacheRegistration = {
  callback: CacheCallback;
  keyParts: string[];
  callArguments: string[][];
  tags: string[];
};

const cache = vi.hoisted<{ registrations: CacheRegistration[] }>(() => ({
  registrations: [],
}));

vi.mock('next/cache', () => ({
  unstable_cache: (
    callback: CacheCallback,
    keyParts: string[],
    options?: { tags?: string[] },
  ): CacheCallback => {
    const registration: CacheRegistration = {
      callback,
      keyParts,
      callArguments: [],
      tags: options?.tags ?? [],
    };
    cache.registrations.push(registration);
    return async (...args: string[]) => {
      registration.callArguments.push(args);
      return callback(...args);
    };
  },
}));

const { loadColumnArchive, loadColumnPost } = await import('./column-api');

const fetchMock = vi.fn();
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function respondWith(body: unknown, status = 200): void {
  fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(body, status)));
}

function registrationAt(index: number): CacheRegistration {
  const registration = cache.registrations[index];
  if (!registration) throw new Error(`캐시 등록 ${index}번이 없습니다.`);
  return registration;
}

function latestRegistration(key: string): CacheRegistration {
  const registration = [...cache.registrations]
    .reverse()
    .find(({ keyParts }) => keyParts[0] === key);
  if (!registration) throw new Error(`캐시 등록 ${key}가 없습니다.`);
  return registration;
}

beforeEach(() => {
  fetchMock.mockReset();
  consoleError.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('ROOTTALE_API_KEY', 'rtlk_cache_secret');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://api.example.com');
  for (const registration of cache.registrations) registration.callArguments.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

afterAll(() => {
  consoleError.mockRestore();
});

describe('칼럼 CMS 캐시 경계', () => {
  test('목록 CMS 장애는 캐시 콜백에서 reject하고 공개 로더에서 안전하게 처리한다', async () => {
    respondWith({ message: '일시적인 CMS 장애' }, 503);
    const registration = registrationAt(0);

    await expect(registration.callback()).rejects.toThrow('일시적인 CMS 장애');
    expect(consoleError).not.toHaveBeenCalled();

    await expect(loadColumnArchive()).resolves.toEqual({ ok: false, reason: 'upstream' });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('RootTale 칼럼 CMS 요청 실패'),
    );
  });

  test('상세 CMS 장애는 글별 캐시 콜백 밖에서 안전하게 처리한다', async () => {
    respondWith({ message: '일시적인 CMS 장애' }, 503);

    await expect(loadColumnPost('migrated-slug'))
      .resolves.toEqual({ ok: false, reason: 'upstream' });
    const registration = latestRegistration('column-detail-v1');
    await expect(registration.callback()).rejects.toThrow('일시적인 CMS 장애');
    expect(registration.keyParts).toEqual(['column-detail-v1', 'migrated-slug']);
  });

  test('성공한 빈 목록과 없는 상세는 캐시 가능한 권위 응답으로 유지한다', async () => {
    respondWith({ items: [], has_more: false, next_cursor: null });
    await expect(registrationAt(0).callback()).resolves.toEqual([]);
    await expect(loadColumnArchive()).resolves.toEqual({ ok: true, data: [] });

    respondWith({ message: 'not found' }, 404);
    await expect(loadColumnPost('gone')).resolves.toEqual({ ok: true, data: null });
    await expect(latestRegistration('column-detail-v1').callback()).resolves.toBeNull();
  });

  test('목록 캐시는 본문 HTML·JSON을 보관하지 않는다', async () => {
    const largeBody = '본문'.repeat(1_100_000);
    respondWith({
      items: [{
        id: 'archive-post',
        type: 'post',
        collection_key: 'column',
        slug: 'small-cache-entry',
        title: '요약만 남는 글',
        excerpt: '목록 설명',
        published_at: '2026-09-15T00:00:00+09:00',
        updated_at: '2026-09-15T01:00:00+09:00',
        body_html: largeBody,
        body_json: { content: largeBody },
        meta_json: { seo: { title: '검색 제목', description: '검색 설명' }, unused: largeBody },
      }],
      has_more: false,
      next_cursor: null,
    });

    const result = await loadColumnArchive();

    expect(result).toEqual({
      ok: true,
      data: [{
        slug: 'small-cache-entry',
        path: null,
        title: '요약만 남는 글',
        excerpt: '목록 설명',
        publishedAt: '2026-09-15T00:00:00+09:00',
        updatedAt: '2026-09-15T01:00:00+09:00',
        featuredImageUrl: null,
        metaJson: { seo: { title: '검색 제목', description: '검색 설명' } },
        terms: [],
      }],
    });
    expect(JSON.stringify(result)).not.toContain(largeBody);
  });

  test('목록 캐시는 SEO 두 값 밖의 메타데이터를 보관하지 않는다', async () => {
    respondWith({
      items: [{
        id: 'archive-post', type: 'post', collection_key: 'column', slug: 'meta-entry',
        title: '메타 글', excerpt: '설명', published_at: '2026-09-15T00:00:00+09:00',
        body_json: {}, meta_json: { seo: { description: '검색 설명' }, internal: { memo: '비공개' } },
      }],
      has_more: false, next_cursor: null,
    });

    await expect(loadColumnArchive()).resolves.toEqual({
      ok: true,
      data: [expect.objectContaining({ metaJson: { seo: { description: '검색 설명' } } })],
    });
  });

  test('비밀 설정값은 명시 캐시 키나 캐시 함수 인자에 들어가지 않는다', async () => {
    respondWith({ items: [], has_more: false, next_cursor: null });

    await loadColumnArchive();
    await loadColumnPost('public-slug');

    expect(cache.registrations.map(({ keyParts }) => keyParts).slice(-1))
      .toEqual([['column-detail-v1', 'public-slug']]);
    expect(registrationAt(0).callArguments).toEqual([[]]);
    expect(latestRegistration('column-detail-v1').callArguments).toEqual([[]]);

    expect(registrationAt(0).tags).toEqual(['column:all', 'column:archive']);
    expect(latestRegistration('column-detail-v1').tags)
      .toEqual(['column:all', 'column:detail:public-slug']);

    const cacheKeyMaterial = cache.registrations.flatMap(({ keyParts, callArguments }) => [
      ...keyParts,
      ...callArguments.flat(),
    ]);
    expect(cacheKeyMaterial).not.toContain('rtlk_cache_secret');
  });
});
