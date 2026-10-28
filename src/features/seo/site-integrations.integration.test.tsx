import '../../test-support/next-cache';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextCacheFixture } from '../../test-support/next-cache';
import { POST } from '../../app/api/revalidate/route';
import { loadSiteVerification } from './site-verification';
import { withSiteTracking } from './with-site-tracking';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'gwangju2020blog.madiclinic.co.kr' }),
}));
vi.mock('@roottale/cms-client/webhook', () => ({
  verifyRootTaleWebhook: async () => ({ ok: true, event: 'theme.updated', deliveryId: 'integrations-fixture' }),
}));

let runtime: ReturnType<typeof nextCacheFixture>;
let gtmId: string | undefined;
let reads: number;
const page = withSiteTracking(async () => <main>공개 화면</main>);

beforeEach(() => {
  runtime = nextCacheFixture();
  reads = 0;
  gtmId = 'GTM-FIRST1234';
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('fetch', runtime.cachedFetch(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (!url.pathname.endsWith('/theme')) throw new Error(`예상하지 못한 fixture 경로: ${url.pathname}`);
    reads += 1;
    return Response.json({
      siteVerification: { google: [`verification-${gtmId ?? 'empty'}`] },
      siteTracking: { googleTagManagerId: gtmId },
    });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

function renderRequest() {
  return runtime.request(async () => {
    const [verification, content] = await Promise.all([loadSiteVerification(), page(undefined)]);
    return { verification, html: renderToStaticMarkup(content) };
  }, '/column/page');
}

async function saveTheme() {
  await new Promise((resolve) => setTimeout(resolve, 5));
  const response = await runtime.request(() => POST(new Request('https://site.test/api/revalidate', {
    method: 'POST', body: JSON.stringify({ paths: [] }),
  })), '/api/revalidate/route');
  expect(response.status).toBe(200);
  await new Promise((resolve) => setTimeout(resolve, 2));
}

test('metadata와 공개 페이지가 theme을 한 번 읽고 저장 알림 뒤 소유 확인·GTM을 함께 갱신한다', async () => {
  const first = await renderRequest();
  expect(first.verification?.google).toEqual(['verification-GTM-FIRST1234']);
  expect(first.html).toContain('GTM-FIRST1234');
  expect(reads).toBe(1);
  gtmId = 'GTM-NEXT1234';
  expect((await renderRequest()).html).toContain('GTM-FIRST1234');
  expect(reads).toBe(1);
  await saveTheme();
  const updated = await renderRequest();
  expect(updated.verification?.google).toEqual(['verification-GTM-NEXT1234']);
  expect(updated.html).toContain('GTM-NEXT1234');
  expect(updated.html).not.toContain('GTM-FIRST1234');
  expect(reads).toBe(2);
});

test('GTM 삭제 저장 알림 뒤 과거 컨테이너를 출력하지 않는다', async () => {
  expect((await renderRequest()).html).toContain('GTM-FIRST1234');
  gtmId = undefined;
  await saveTheme();
  expect((await renderRequest()).html).toBe('<main>공개 화면</main>');
  expect(reads).toBe(2);
});
