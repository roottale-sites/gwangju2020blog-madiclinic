import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { loadSiteIntegrations, loadSiteVerification } from './site-verification';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.stubEnv('NEXT_PUBLIC_ROOTTALE_SITE_ID', 'fixture-site');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

test('동일 theme 응답에서 소유 확인 코드와 GTM을 읽고 웹훅 태그를 유지한다', async () => {
  fetchMock.mockResolvedValue(Response.json({
    siteVerification: { google: ['google-fixture'], naver: ['naver-fixture'] },
    siteTracking: { googleTagManagerId: 'GTM-TEST1234' },
  }));
  expect(await loadSiteIntegrations()).toEqual({
    verification: { google: ['google-fixture'], other: { 'naver-site-verification': ['naver-fixture'] } },
    googleTagManagerId: 'GTM-TEST1234',
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0]?.[0]).toBe('https://cms.example.test/v1/cms/public/theme?site_id=fixture-site');
  expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
    next: { tags: ['rt-theme'], revalidate: 3600 }, signal: expect.any(AbortSignal),
  });
});

test.each([{}, { siteVerification: {}, siteTracking: { googleTagManagerId: '' } }])(
  '정상 조회의 빈 설정은 과거 코드로 대체하지 않는다: %j', async (theme) => {
    fetchMock.mockImplementation(async () => Response.json(theme));
    const integrations = await loadSiteIntegrations();
    expect(integrations.verification).toBeUndefined();
    expect(integrations.googleTagManagerId || undefined).toBeUndefined();
    expect(await loadSiteVerification()).toBeUndefined();
  },
);

test.each(['', 'local_unconfigured'])('키 미설정(%s)은 조회 없이 소유 확인 대체값만 반환한다', async (key) => {
  vi.stubEnv('ROOTTALE_API_KEY', key);
  const integrations = await loadSiteIntegrations();
  expect(integrations.verification?.google).toHaveLength(1);
  expect(integrations.verification?.other?.['naver-site-verification']).toHaveLength(1);
  expect(integrations.googleTagManagerId).toBeUndefined();
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each(['network', 'http', 'invalid-json'])('theme 조회 실패(%s)는 마지막 확인 값을 쓰고 비밀값을 기록하지 않는다', async (failure) => {
  if (failure === 'network') fetchMock.mockRejectedValue(new Error('fixture-secret'));
  else fetchMock.mockResolvedValue(new Response('fixture-secret', { status: failure === 'http' ? 503 : 200 }));
  const integrations = await loadSiteIntegrations();
  expect(integrations.verification?.google).toHaveLength(1);
  expect(integrations.googleTagManagerId).toBe('GTM-T7TXDQ88');
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('fixture-secret');
});
