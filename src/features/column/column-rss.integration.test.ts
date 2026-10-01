import '../../test-support/next-cache';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextCacheFixture } from '../../test-support/next-cache';
import { GET } from '../../app/column/rss.xml/route';
import { POST } from '../../app/api/revalidate/route';

// 서명 검증은 route-signature.test.ts가 담당한다. 캐시와 XML 라우트는 실제 구현이다.
vi.mock('@roottale/cms-client/webhook', () => ({
  verifyRootTaleWebhook: async () => ({ ok: true, event: 'post.updated', deliveryId: 'rss-test' }),
}));

function post(slug = 'article') {
  return {
    id: slug, type: 'post', collection_key: 'column', slug,
    path: `/column/shoulder/${slug}`, title: '칼럼 제목', excerpt: '짧은 요약',
    published_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
    body_html: '<p>요약에 없는 전체 본문 마지막 문단</p>', body_json: {}, meta_json: {},
    terms: [{ taxonomy: 'category', slug: 'shoulder', name: '어깨' }],
  };
}

let runtime: ReturnType<typeof nextCacheFixture>;
let posts: ReturnType<typeof post>[];
let reads: number;
let failCms: boolean;

beforeEach(() => {
  runtime = nextCacheFixture();
  posts = [post()];
  reads = 0;
  failCms = false;
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (!url.pathname.endsWith('/posts')) throw new Error(`예상하지 않은 개별 글 조회: ${url.pathname}`);
    reads += 1;
    if (failCms) return Response.json({ message: 'fixture unavailable' }, { status: 503 });
    return Response.json({ items: posts.slice(0, Number(url.searchParams.get('limit'))), has_more: false, next_cursor: null });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function feed() {
  return runtime.request(GET, '/column/rss.xml/route');
}

async function webhook() {
  await new Promise((resolve) => setTimeout(resolve, 5));
  const response = await runtime.request(() => POST(new Request('https://site.test/api/revalidate', {
    method: 'POST', body: JSON.stringify({ modelKey: 'column', paths: ['/column/shoulder/article'] }),
  })), '/api/revalidate/route');
  expect(response.status).toBe(200);
  await new Promise((resolve) => setTimeout(resolve, 2));
}

test('한 번의 목록 조회로 전체 본문을 제공하고 반복 요청은 캐시를 읽는다', async () => {
  const response = await feed();
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
  expect(response.headers.get('cache-control')).toBe('no-store');
  const xml = await response.text();
  expect(xml).toContain('<content:encoded><![CDATA[<p>요약에 없는 전체 본문 마지막 문단</p>');
  expect(await (await feed()).text()).toBe(xml);
  expect(reads).toBe(1);
});

test('본문 수정·주소 이동·삭제가 웹훅 후 RSS에 반영된다', async () => {
  await feed();
  posts[0]!.body_html = '<p>수정한 전체 본문</p>';
  posts[0]!.path = '/column/neck/moved';
  await webhook();
  const updated = await (await feed()).text();
  expect(updated).toContain('수정한 전체 본문');
  expect(updated).toContain('/column/neck/moved</link>');
  expect(updated).not.toContain('/column/shoulder/article</link>');
  posts = [];
  await webhook();
  expect(await (await feed()).text()).not.toContain('<item>');
  expect(reads).toBe(3);
});

test('빈 피드도 첫 발행 웹훅 후 새 글의 본문을 포함한다', async () => {
  posts = [];
  expect(await (await feed()).text()).not.toContain('<item>');
  posts = [post()];
  await webhook();
  expect(await (await feed()).text()).toContain('전체 본문 마지막 문단');
});

test('CMS 장애를 빈 피드로 캐시하지 않고 복구 후 본문을 제공한다', async () => {
  failCms = true;
  const response = await feed();
  expect(response.status).toBe(503);
  expect(response.headers.get('retry-after')).toBe('300');
  failCms = false;
  expect(await (await feed()).text()).toContain('전체 본문 마지막 문단');
});
