import '../../test-support/next-cache';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextCacheFixture } from '../../test-support/next-cache';
import { loadArchiveSeo } from './archive-seo';
import { loadRouteSeo } from './route-seo';
import { metadataRoute, metadataRoutePath } from './metadata-contract';
import { POST } from '../../app/api/revalidate/route';
import { DEFAULT_OG_IMAGE_URL } from './og-image';
import { generateMetadata as columnMetadata } from '../../app/column/page';
import { generateMetadata as reviewsMetadata } from '../../app/reviews/page';
import { generateMetadata as faqMetadata } from '../../app/faq/page';

vi.mock('@roottale/cms-client/webhook', () => ({
  verifyRootTaleWebhook: async () => ({ ok: true, event: 'theme.updated', deliveryId: 'metadata-test' }),
}));


function record(routeKey: string) {
  const route = metadataRoute(routeKey);
  const overrides: Record<string, string | boolean> = { title: `${routeKey} SEO 제목`, description: `${routeKey} SEO 설명`,
    ogImage: 'https://images.example.test/custom.png', ogImageAlt: '목록 안내' };
  return {
    routeKey, locale: 'ko', path: metadataRoutePath(route), version: 'route:1',
    defaults: route.defaults, fallback: route.fallback, supportedFields: route.supportedFields,
    overrides,
    effective: {},
  };
}

let runtime: ReturnType<typeof nextCacheFixture>;
let records: ReturnType<typeof record>[];
let reads: number;
let fail: boolean;

beforeEach(() => {
  runtime = nextCacheFixture();
  records = ['column', 'reviews', 'faq'].map(record);
  reads = 0; fail = false;
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('fetch', runtime.cachedFetch(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith('/blog-settings')) {
      return Response.json({ site_profile: { default_og_image_url: 'https://images.example.test/default.png' } });
    }
    if (url.pathname.endsWith('/metadata')) {
      if (fail) throw new Error('fixture-secret upstream failure');
      reads += 1;
      return Response.json({ metadata: records.find((item) => item.routeKey === url.searchParams.get('route_key')) ?? null });
    }
    throw new Error(`예상하지 못한 fixture 경로: ${url.pathname}`);
  }));
});

afterEach(() => {
  vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
});

async function webhook(key: string) {
  // Next 캐시의 밀리초 단위 저장/만료 시각을 실제 요청처럼 분리한다.
  await new Promise((resolve) => setTimeout(resolve, 5));
  const response = await runtime.request(() => POST(new Request('https://site.test/api/revalidate', {
    method: 'POST', body: JSON.stringify({ paths: [metadataRoutePath(metadataRoute(key)), '/sitemap.xml'] }),
  })), '/api/revalidate/route');
  expect(response.status).toBe(200);
  await new Promise((resolve) => setTimeout(resolve, 2));
}

test('실제 목록 라우트가 키 직접 조회의 SEO·검증 표식과 기존 canonical을 출력한다', async () => {
  for (const [key, generate] of [['column', () => columnMetadata({ searchParams: Promise.resolve({}) })], ['reviews', () => reviewsMetadata({ searchParams: Promise.resolve({}) })], ['faq', faqMetadata]] as const) {
    const metadata = await runtime.request(generate);
    expect(metadata.title).toEqual({ absolute: `${key} SEO 제목` });
    expect(metadata.description).toBe(`${key} SEO 설명`);
    expect(metadata.alternates?.canonical).toBe(metadataRoutePath(metadataRoute(key)));
    expect(metadata.openGraph).toMatchObject({ title: `${key} SEO 제목`,
      images: [{ url: 'https://images.example.test/custom.png', alt: '목록 안내' }] });
    expect(metadata.twitter).toMatchObject({ description: `${key} SEO 설명` });
    expect(metadata.other).toMatchObject({ 'rt:metadata-route-key': key, 'rt:metadata-version': 'route:1' });
    expect(metadata.other?.['rt:metadata-contract']).toMatch(/^[a-f0-9]{64}$/);
  }
});

test('서명 알림 뒤 SDK 키 캐시를 만료해 수정값과 초기화를 즉시 반영한다', async () => {
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe(`${'column'} SEO 제목`);
  records[0]!.overrides.title = '수정된 검색 제목';
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe(`${'column'} SEO 제목`);
  expect(reads).toBe(1);
  await webhook('column');
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe('수정된 검색 제목');
  records[0]!.overrides = {};
  await webhook('column');
  expect(await runtime.request(() => loadArchiveSeo('column'))).toMatchObject({
    title: metadataRoute('column').defaults.title,
    description: metadataRoute('column').defaults.description,
    imageUrl: 'https://images.example.test/default.png',
  });
});

test('미등록 응답은 코드 기본값을 사용하고 설치 뒤 알림으로 연결된다', async () => {
  const saved = records.shift()!;
  expect((await runtime.request(() => loadRouteSeo('column'))).title).toBe(metadataRoute('column').defaults.title);
  records.unshift(saved);
  await webhook('column');
  expect((await runtime.request(() => loadRouteSeo('column'))).title).toBe(`${'column'} SEO 제목`);
});

test('API 장애 폴백을 정상 응답처럼 캐시하지 않아 복구 후 다시 읽는다', async () => {
  fail = true;
  expect((await runtime.request(() => loadRouteSeo('column'))).title).toBe(metadataRoute('column').defaults.title);
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('fixture-secret');
  fail = false;
  expect((await runtime.request(() => loadRouteSeo('column'))).title).toBe(`${'column'} SEO 제목`);
});

test('키 미설정 때 API 요청 없이 배포 계약의 기본값을 사용한다', async () => {
  vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
  expect(await loadRouteSeo('column')).toMatchObject({ title: metadataRoute('column').defaults.title, imageUrl: DEFAULT_OG_IMAGE_URL });
  expect(reads).toBe(0);
});
