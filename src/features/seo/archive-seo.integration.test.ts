import '../../test-support/next-cache';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextCacheFixture } from '../../test-support/next-cache';
import { loadArchiveSeo } from './archive-seo';
import { POST } from '../../app/api/revalidate/route';
import { generateMetadata as columnMetadata } from '../../app/column/page';
import { generateMetadata as reviewsMetadata } from '../../app/reviews/page';
import { generateMetadata as faqMetadata } from '../../app/faq/page';
import { columnIndexMetadata } from '../column/column-content';
import { DEFAULT_OG_IMAGE_URL } from './og-image';

vi.mock('@roottale/cms-client/webhook', () => ({
  verifyRootTaleWebhook: async () => ({ ok: true, event: 'post.updated', deliveryId: 'metadata-test' }),
}));

function page(slug: string) {
  return {
    id: `page-${slug}`, tenant_id: 'fixture-tenant', site_id: 'fixture-site',
    type: 'page', model_key: 'page', slug, path: `/${slug}`, status: 'published',
    title: `${slug} 페이지 제목`, excerpt: `${slug} 페이지 요약`, body_json: {},
    meta_json: { seo: { title: `${slug} SEO 제목`, description: `${slug} SEO 설명`,
      ogImage: 'https://images.example.test/custom.png', ogImageAlt: '목록 안내' } },
    terms: [], published_at: '2026-10-08T00:00:00Z', updated_at: '2026-10-08T00:00:00Z',
  };
}

let runtime: ReturnType<typeof nextCacheFixture>;
let pages: ReturnType<typeof page>[];
let reads: number;
let fail: boolean;

beforeEach(() => {
  runtime = nextCacheFixture();
  pages = ['column', 'reviews', 'faq'].map(page);
  reads = 0;
  fail = false;
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/blog-settings')) {
      return Response.json({ site_profile: { default_og_image_url: 'https://images.example.test/default.png' } });
    }
    if (url.pathname.endsWith('/posts') && url.searchParams.get('type') === 'page') {
      if (fail) throw new Error('fixture-secret upstream failure');
      reads += 1;
      return Response.json({ items: pages, has_more: false, next_cursor: null });
    }
    throw new Error(`예상하지 못한 fixture 경로: ${url.pathname}`);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function webhook(key: string) {
  await new Promise((resolve) => setTimeout(resolve, 5));
  const response = await runtime.request(() => POST(new Request('https://site.test/api/revalidate', {
    method: 'POST', body: JSON.stringify({ modelKey: 'page', slug: key, paths: [`/${key}`] }),
  })), '/api/revalidate/route');
  expect(response.status).toBe(200);
  await new Promise((resolve) => setTimeout(resolve, 2));
}

test('세 목록의 실제 라우트가 CMS SEO와 공유 설정을 읽고 canonical·RSS를 유지한다', async () => {
  for (const [key, generate] of [
    ['column', () => columnMetadata({ searchParams: Promise.resolve({}) })],
    ['reviews', () => reviewsMetadata({ searchParams: Promise.resolve({}) })],
    ['faq', faqMetadata],
  ] as const) {
    const metadata = await runtime.request(generate);
    expect(metadata.title).toEqual({ absolute: `${key} SEO 제목` });
    expect(metadata.description).toBe(`${key} SEO 설명`);
    expect(metadata.alternates).toMatchObject({ canonical: `/${key}`,
      types: { 'application/rss+xml': `/${key}/rss.xml` } });
    expect(metadata.openGraph).toMatchObject({ title: `${key} SEO 제목`,
      images: [{ url: 'https://images.example.test/custom.png', alt: '목록 안내' }] });
    expect(metadata.twitter).toMatchObject({ description: `${key} SEO 설명` });
  }
});

test('저장 전 캐시를 사용하고 페이지 수정·발행 해제 알림 뒤 즉시 새 값을 읽는다', async () => {
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe('column SEO 제목');
  pages[0]!.meta_json.seo.title = '수정된 검색 제목';
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe('column SEO 제목');
  expect(reads).toBe(1);
  await webhook('column');
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe('수정된 검색 제목');
  pages = pages.filter((item) => item.slug !== 'column');
  await webhook('column');
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe(columnIndexMetadata.title);
});

test('SEO 값을 비우면 페이지 제목·요약과 공통 이미지로 돌아간다', async () => {
  pages[0]!.meta_json.seo = { title: ' ', description: '', ogImage: '', ogImageAlt: '' };
  expect(await runtime.request(() => loadArchiveSeo('column'))).toMatchObject({
    title: 'column 페이지 제목', description: 'column 페이지 요약',
    imageUrl: 'https://images.example.test/default.png', imageAlt: undefined,
  });
});

test('미등록 캐시를 읽은 뒤 최초 발행 알림으로 페이지가 연결된다', async () => {
  const saved = pages.shift()!;
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe(columnIndexMetadata.title);
  pages.unshift(saved);
  await webhook('column');
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe('column SEO 제목');
});

test('CMS 오류 때 기본값으로 동작하고 오류 내용을 숨기며 복구 결과를 다시 읽는다', async () => {
  fail = true;
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe(columnIndexMetadata.title);
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('fixture-secret');
  fail = false;
  expect((await runtime.request(() => loadArchiveSeo('column'))).title).toBe('column SEO 제목');
});

test('키 미설정 때 API 요청 없이 현재 제목과 이미지를 사용한다', async () => {
  vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
  expect(await loadArchiveSeo('column')).toMatchObject({
    title: columnIndexMetadata.title, imageUrl: DEFAULT_OG_IMAGE_URL,
  });
  expect(reads).toBe(0);
});

test('CMS 연결 뒤에도 검색·필터의 noindex와 페이지 번호의 색인 허용을 유지한다', async () => {
  const search = await runtime.request(() => columnMetadata({ searchParams: Promise.resolve({ q: '통증' }) }));
  const filtered = await runtime.request(() => reviewsMetadata({ searchParams: Promise.resolve({ category: '무릎' }) }));
  const paginated = await runtime.request(() => reviewsMetadata({ searchParams: Promise.resolve({ page: '2' }) }));
  expect(search.robots).toMatchObject({ index: false });
  expect(filtered.robots).toMatchObject({ index: false });
  expect(paginated.robots).toMatchObject({ index: true });
});
