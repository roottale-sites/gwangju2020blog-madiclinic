import { runInNewContext } from 'node:vm';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { siteOrigin } from '../../data/site';
import { RootAnalytics } from './RootAnalytics';

vi.mock('./RootAnalyticsClient', () => ({ RootAnalyticsClient: () => null }));
vi.mock('./root-analytics-config', () => ({
  loadRootAnalyticsConfig: async () => ({
    siteId: 'fixture-site', tags: [], collectUrl: 'https://collector.example.test/v1/collect',
  }),
}));

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

it.each([
  [siteOrigin, 'https://collector.example.test/v1/collect'],
  ['http://localhost:49117', '/api/analytics/debug'],
])('%s의 최초 조회를 v3 비콘이 지정된 수집기로 한 번 보낸다', async (origin, endpoint) => {
  const markup = renderToStaticMarkup(await RootAnalytics());
  const script = markup.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  expect(script).toBeDefined();
  const sendBeacon = vi.fn<(endpoint: string, body: Blob) => boolean>(() => true);
  const document = Object.assign(new EventTarget(), {
    referrer: '', visibilityState: 'visible', querySelector: () => null,
  });
  const browser = new EventTarget();
  runInNewContext(script!, {
    window: browser, document, location: new URL('/column?utm_source=naver', origin),
    navigator: { language: 'ko-KR', sendBeacon },
    localStorage: storage(), sessionStorage: storage(),
    URL, URLSearchParams, Blob, Event,
    performance: { now: () => 0, getEntriesByType: () => [] },
  });

  expect(sendBeacon).toHaveBeenCalledTimes(1);
  expect(sendBeacon.mock.calls[0]?.[0]).toBe(endpoint);
  const body = sendBeacon.mock.calls[0]?.[1] as Blob;
  const payload = JSON.parse(await body.text());
  expect(payload).toMatchObject({
    ev: 'pageview', bv: 3, vs: 1, pd: -1, ud: -1, sid: 'fixture-site',
    path: '/column', us: 'naver', lg: 'ko',
  });
  expect(payload.sd).toBeTypeOf('number');
  expect(payload).not.toHaveProperty('nv');
});
