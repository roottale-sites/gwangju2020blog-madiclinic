import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { reviewFixture } from './review-fixture';

const mocks = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  fetchPosts: vi.fn(),
  fetchPost: vi.fn(),
}));

vi.mock('@roottale/cms-client/server', async (importOriginal) => ({
  ...await importOriginal<typeof import('@roottale/cms-client/server')>(),
  fetchPosts: mocks.fetchPosts,
  fetchPost: mocks.fetchPost,
}));

// Next 캐시처럼 성공 응답만 저장한다. 실패를 정상 값으로 반환하면 재현된다.
vi.mock('next/cache', () => ({
  unstable_cache: (callback: () => Promise<unknown>, keys: string[]) => async () => {
    const key = JSON.stringify(keys);
    if (mocks.values.has(key)) return mocks.values.get(key);
    const value = await callback();
    mocks.values.set(key, value);
    return value;
  },
}));

const { loadReviewArchive, loadReview } = await import('./review-api');

beforeEach(() => {
  mocks.values.clear();
  mocks.fetchPosts.mockReset();
  mocks.fetchPost.mockReset();
  vi.stubEnv('ROOTTALE_API_KEY', 'test-key');
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('후기 CMS 캐시 복구', () => {
  test('연결 전 상태를 저장하지 않아 설정 직후 목록과 상세가 보인다', async () => {
    vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
    expect(await loadReviewArchive()).toEqual({ ok: false, reason: 'unconfigured' });
    expect(await loadReview('review')).toEqual({ ok: false, reason: 'unconfigured' });
    expect(mocks.values.size).toBe(0);

    vi.stubEnv('ROOTTALE_API_KEY', 'test-key');
    const post = reviewFixture();
    mocks.fetchPosts.mockResolvedValue({ items: [post], hasMore: false });
    mocks.fetchPost.mockResolvedValue(post);
    expect(await loadReviewArchive()).toEqual({ ok: true, data: [post] });
    expect(await loadReview('review')).toEqual({ ok: true, data: post });
  });

  test('일시 장애 다음 요청은 CMS를 다시 읽고 성공 결과를 캐시한다', async () => {
    mocks.fetchPosts.mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue({ items: [], hasMore: false });
    mocks.fetchPost.mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue(null);

    expect(await loadReviewArchive()).toEqual({ ok: false, reason: 'upstream' });
    expect(await loadReview('missing')).toEqual({ ok: false, reason: 'upstream' });
    expect(mocks.values.size).toBe(0);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      expect(await loadReviewArchive()).toEqual({ ok: true, data: [] });
      expect(await loadReview('missing')).toEqual({ ok: true, data: null });
    }
    expect(mocks.fetchPosts).toHaveBeenCalledTimes(2);
    expect(mocks.fetchPost).toHaveBeenCalledTimes(2);
  });
});
