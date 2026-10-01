import '../../test-support/next-cache';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextCacheFixture } from '../../test-support/next-cache';
import { resolveFaqCollection, resolveFaqDetailCollection } from './faq-source';
import { relatedFaqEntries } from './faq-model';
import { POST } from '../../app/api/revalidate/route';

// 서명 경계는 route-signature.test.ts가 실제 ES256으로 검사한다.
vi.mock('@roottale/cms-client/webhook', () => ({
  verifyRootTaleWebhook: async ({ headers }: { headers: Headers }) => ({
    ok: true, event: headers.get('x-test-event') ?? 'post.updated', deliveryId: 'test-delivery',
  }),
}));

function post(slug: string, category = 'neck', fields: Record<string, unknown> = {}) {
  return {
    id: `id-${slug}`, model_key: 'faq', collection_key: 'faq', type: 'post',
    slug, title: `${slug} 질문`, excerpt: `${slug} 핵심 답변`,
    updated_at: '2026-10-01T00:00:00.000Z',
    path: `/faq/${category === 'neck' ? 'spine' : 'joint'}/${category}/${slug}`,
    previous_slugs: [] as string[],
    body_json: { type: 'doc', content: [{ type: 'paragraph', content: [{
      type: 'text', text: slug === 'reference'
        ? '[[internal:faq.spine.neck.target|대상 질문]]' : `${slug} 본문`,
    }] }] },
    body_html: null, fields,
    terms: [{ id: category, taxonomy: 'category', slug: category, name: category }],
  };
}

const initialCategories = [
  { id: 'spine', parent_id: null, slug: 'spine', name: '척추', collection_key: 'faq' },
  { id: 'neck', parent_id: 'spine', slug: 'neck', name: '목', collection_key: 'faq' },
  { id: 'joint', parent_id: null, slug: 'joint', name: '관절', collection_key: 'faq' },
  { id: 'knee', parent_id: 'joint', slug: 'knee', name: '무릎', collection_key: 'faq' },
];
let posts: ReturnType<typeof post>[];
let categories: typeof initialCategories;
let cmsReads: number;
let failCms: boolean;
let runtime: ReturnType<typeof nextCacheFixture>;

beforeEach(() => {
  runtime = nextCacheFixture();
  cmsReads = 0;
  failCms = false;
  posts = [post('target'), post('auto'), post('reference', 'knee', { related_content_keys: 'faq.spine.neck.target' }),
    post('by-id', 'knee', { related_faqs: ['id-target'] }), post('unrelated', 'knee')];
  categories = structuredClone(initialCategories);
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example.test');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    if (failCms) throw new Error('fixture CMS unavailable');
    const path = new URL(String(input)).pathname;
    let body: unknown;
    if (path.endsWith('/content-models')) {
      body = { models: [{ key: 'faq', presentation: { kind: 'category_tree', basePath: '/faq', categoryDepth: 2 } }] };
    } else if (path.endsWith('/categories')) {
      body = { categories };
    } else if (path.endsWith('/posts')) {
      cmsReads += 1;
      body = { items: posts, has_more: false, next_cursor: null };
    } else throw new Error(`Unexpected fixture path: ${path}`);
    return Response.json(body);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function detail(slug: string, section = 'spine', topic = 'neck') {
  return runtime.request(() => resolveFaqDetailCollection(section, topic, slug));
}

async function webhook(paths = ['/faq/spine/neck/target'], event = 'post.updated') {
  // Next는 tag 만료 시각이 캐시 작성 시각보다 클 때 만료로 판단한다.
  // 실제 편집처럼 캐시 읽기와 웹훅 사이에 시간 경계를 둔다.
  await new Promise((resolve) => setTimeout(resolve, 5));
  const response = await runtime.request(() => POST(new Request('https://site.test/api/revalidate', {
    method: 'POST', headers: { 'x-test-event': event },
    body: JSON.stringify({ modelKey: 'faq', postId: 'id-target', paths }),
  })), '/api/revalidate/route');
  expect(response.status).toBe(200);
  // Next의 캐시 기록과 만료가 같은 밀리초에 겹치지 않도록 실제 시간 경계를 넘긴다.
  await new Promise((resolve) => setTimeout(resolve, 2));
}

test('서로 다른 FAQ 상세와 목록을 방문해도 CMS 원장은 한 번만 읽는다', async () => {
  await detail('target');
  await detail('auto');
  await detail('reference', 'joint', 'knee');
  await runtime.request(() => resolveFaqCollection());
  expect(cmsReads).toBe(1);
});

test('제목 수정 후 자동 추천·다른 분류의 ID/예약 키 참조도 최신 제목을 읽는다', async () => {
  await detail('auto');
  await detail('reference', 'joint', 'knee');
  await detail('by-id', 'joint', 'knee');
  posts[0]!.title = '수정된 대상 질문';
  cmsReads = 0;
  await webhook();
  for (const [slug, section, topic] of [
    ['auto', 'spine', 'neck'], ['reference', 'joint', 'knee'], ['by-id', 'joint', 'knee'],
  ] as const) {
    const view = await detail(slug, section, topic);
    expect(view.entry).not.toBeNull();
    expect(relatedFaqEntries(view.archive.entries, view.entry!).map((entry) => entry.question))
      .toContain('수정된 대상 질문');
  }
  expect(cmsReads).toBe(1);
});

test('삭제 후 데워 둔 상세·자동 추천·다른 분류 본문 링크에 대상이 남지 않는다', async () => {
  await detail('target');
  await detail('auto');
  await detail('reference', 'joint', 'knee');
  posts = posts.filter((entry) => entry.id !== 'id-target');
  await webhook(['/faq'], 'post.deleted');
  expect((await detail('target')).entry).toBeNull();
  const auto = await detail('auto');
  expect(auto.archive.entries.map((entry) => entry.contentId)).not.toContain('id-target');
  const reference = await detail('reference', 'joint', 'knee');
  expect(reference.entry?.bodyHtml).not.toContain('href="/faq/spine/neck/target"');
  expect(reference.entry?.bodyHtml).toContain('data-internal-link-pending');
});

test('아직 없는 질문의 404·예약 링크를 데운 뒤 발행하면 상세와 링크가 열린다', async () => {
  const target = posts.shift()!;
  expect((await detail('target')).entry).toBeNull();
  expect((await detail('reference', 'joint', 'knee')).entry?.bodyHtml).toContain('data-internal-link-pending');
  posts.unshift(target);
  await webhook(undefined, 'post.published');
  expect((await detail('target')).entry?.question).toBe('target 질문');
  expect((await detail('reference', 'joint', 'knee')).entry?.bodyHtml)
    .toContain('href="/faq/spine/neck/target"');
});

test('slug 변경 뒤 이전 키를 쓰는 본문 링크와 관련 질문도 새 주소를 읽는다', async () => {
  await detail('reference', 'joint', 'knee');
  posts[0] = { ...posts[0]!, slug: 'renamed', path: '/faq/spine/neck/renamed', previous_slugs: ['target'] };
  await webhook(['/faq/spine/neck/target', '/faq/spine/neck/renamed']);
  expect((await detail('target')).entry).toBeNull();
  expect((await detail('renamed')).entry?.contentId).toBe('id-target');
  const reference = await detail('reference', 'joint', 'knee');
  expect(reference.entry?.bodyHtml).toContain('href="/faq/spine/neck/renamed"');
  expect(reference.archive.entries.some((entry) => entry.slug === 'renamed')).toBe(true);
});

test('CMS 장애 중에도 웹훅은 조회 없이 응답하고 이전 상세를 정상 데이터로 되살리지 않는다', async () => {
  await detail('target');
  failCms = true;
  await webhook();
  const result = await detail('target');
  expect(result.status).toBe('upstream');
  expect(result.entry).toBeNull();
  failCms = false;
  posts[0]!.title = '복구 뒤 질문';
  expect((await detail('target')).entry?.question).toBe('복구 뒤 질문');
});

test('분류 이동 뒤 이전 주소·이전 질환 자동 추천에서 빠지고 ID 참조는 새 주소를 읽는다', async () => {
  await detail('target');
  await detail('auto');
  await detail('by-id', 'joint', 'knee');
  posts[0] = post('target', 'knee');
  await webhook(['/faq/spine/neck/target', '/faq/joint/knee/target']);
  expect((await detail('target')).entry).toBeNull();
  expect((await detail('target', 'joint', 'knee')).entry?.contentId).toBe('id-target');
  expect((await detail('auto')).archive.entries.map((entry) => entry.contentId)).not.toContain('id-target');
  const reference = await detail('by-id', 'joint', 'knee');
  expect(reference.archive.entries.find((entry) => entry.contentId === 'id-target')?.path)
    .toBe('/faq/joint/knee/target');
});

test('범위 없는 분류 변경도 기존 상세의 분류 이름과 탐색 메뉴 데이터를 갱신한다', async () => {
  await detail('target');
  categories[0]!.name = '새 진료 영역';
  categories[1]!.name = '새 세부 질환';
  await webhook([], 'taxonomy.updated');
  const view = await detail('target');
  expect(view.taxonomy.sections.find((section) => section.slug === 'spine')?.name).toBe('새 진료 영역');
  expect(view.entry?.topicName).toBe('새 세부 질환');
});

test('중복·순서가 바뀐 웹훅에도 CMS의 최신 발행 상태를 유지한다', async () => {
  await detail('target');
  posts = posts.filter((entry) => entry.id !== 'id-target');
  await webhook(undefined, 'post.deleted');
  expect((await detail('target')).entry).toBeNull();
  // 오래된 발행 알림이 삭제 알림 뒤에 도착해도 글을 되살리면 안 된다.
  await webhook(undefined, 'post.published');
  expect((await detail('target')).entry).toBeNull();
});
