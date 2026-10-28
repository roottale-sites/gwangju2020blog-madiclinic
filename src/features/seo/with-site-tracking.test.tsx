import { renderToStaticMarkup } from 'react-dom/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { withSiteTracking } from './with-site-tracking';

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: vi.fn() }));
vi.mock('next/headers', () => ({ headers: requestHeaders }));
const fetchMock = vi.fn();
const host = 'gwangju2020blog.madiclinic.co.kr';
const trackedPage = withSiteTracking(async () => <main>공개 화면</main>);

beforeEach(() => {
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.stubEnv('VERCEL_ENV', 'production');
  requestHeaders.mockResolvedValue(new Headers({ host }));
  fetchMock.mockReset().mockImplementation(async () => Response.json({
    siteTracking: { googleTagManagerId: 'GTM-TEST1234' },
  }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

test.each([host, host.toUpperCase()])('Production 정식 호스트 %s는 관리자 GTM 스크립트와 iframe을 출력한다', async (requestHost) => {
  requestHeaders.mockResolvedValue(new Headers({ host: requestHost }));
  const html = renderToStaticMarkup(await trackedPage(undefined));
  expect(html).toContain('id="google-tag-manager"');
  expect(html).toContain("'GTM-TEST1234'");
  expect(html).toContain('https://www.googletagmanager.com/ns.html?id=GTM-TEST1234');
  expect(html).toContain('<main>공개 화면</main>');
  expect(html).not.toContain('GTM-T7TXDQ88');
});

test.each([
  ['production', 'preview.vercel.app'], ['production', 'preview.roottale.app'],
  ['production', 'localhost:3000'], ['production', `www.${host}`],
  ['production', `${host}.example.test`], ['production', `${host}:3000`],
  ['production', ''], ['preview', host], ['development', host], ['', host],
])('%s 환경·호스트 %s에는 GTM을 출력하지 않는다', async (environment, requestHost) => {
  vi.stubEnv('VERCEL_ENV', environment);
  requestHeaders.mockResolvedValue(new Headers(requestHost ? { host: requestHost } : {}));
  expect(renderToStaticMarkup(await trackedPage(undefined))).not.toContain('googletagmanager.com');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('운영 호스트라도 관리자 팝업 iframe 미리보기에는 GTM을 출력하지 않는다', async () => {
  requestHeaders.mockResolvedValue(new Headers({ host, 'sec-fetch-dest': 'iframe' }));
  expect(renderToStaticMarkup(await trackedPage(undefined))).not.toContain('googletagmanager.com');
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each([undefined, '', 'invalid', 'GTM-<script>'])('비어 있거나 잘못된 GTM ID(%s)는 출력하지 않는다', async (id) => {
  fetchMock.mockResolvedValue(Response.json({ siteTracking: { googleTagManagerId: id } }));
  const html = renderToStaticMarkup(await trackedPage(undefined));
  expect(html).not.toContain('googletagmanager.com');
  expect(html).toContain('<main>공개 화면</main>');
});

test('theme 장애에도 공개 화면을 유지하고 마지막 확인 GTM을 쓴다', async () => {
  fetchMock.mockRejectedValue(new Error('fixture failure'));
  const html = renderToStaticMarkup(await trackedPage(undefined));
  expect(html).toContain('GTM-T7TXDQ88');
  expect(html).toContain('<main>공개 화면</main>');
});

test.each([['404', notFound], ['주소 이동', () => permanentRedirect('/column')]] as const)(
  '%s 판정 전에 GTM을 조회하거나 출력하지 않는다', async (_, interrupt) => {
    const page = withSiteTracking(async () => interrupt());
    await expect(page(undefined)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  },
);
