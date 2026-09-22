import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

type CacheCallback = () => Promise<unknown>;

vi.mock('next/cache', () => ({
  unstable_cache: (callback: CacheCallback): CacheCallback => callback,
}));

const { loadFaqCatalog } = await import('./faq-api');
const { relatedFaqEntries } = await import('./faq-model');

const fetchMock = vi.fn();
const INTERNAL_TOKEN = '[[internal:faq.spine.neck-pain.mri-normal|MRI가 정상인 목 통증]]';

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function post(
  slug: string,
  title: string,
  bodyText = '일반 본문',
  fields: Record<string, unknown> = {},
) {
  return {
    id: `post-${slug}`,
    type: 'post',
    model_key: 'faq',
    collection_key: 'faq',
    slug,
    title,
    excerpt: '핵심 답변',
    published_at: '2026-09-15T00:00:00.000Z',
    updated_at: '2026-09-15T00:00:00.000Z',
    body_json: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: bodyText }] }],
    },
    body_html: `<p>${bodyText}</p>`,
    fields,
    terms: [{ id: 'top-neck', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' }],
  };
}

function importedHtmlPost(slug: string, title: string, html: string) {
  return {
    ...post(slug, title),
    body_json: { type: 'doc', content: [{ type: 'importedHtml', attrs: { html } }] },
    body_html: '<p>오래된 HTML 파생값</p>',
  };
}

const MODEL_RESPONSE = {
  models: [{
    key: 'faq',
    presentation: { kind: 'category_tree', basePath: '/faq', categoryDepth: 2 },
  }],
};

const CATEGORIES_RESPONSE = {
  categories: [
    { id: 'sec-spine', parent_id: null, slug: 'spine', name: '척추 통증', collection_key: 'faq' },
    { id: 'top-neck', parent_id: 'sec-spine', slug: 'neck-pain', name: '목 통증', collection_key: 'faq' },
  ],
};

function installCmsResponses(
  items: readonly unknown[],
  overrides: { model?: unknown; categories?: unknown } = {},
): void {
  fetchMock.mockImplementation((input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/v1/cms/public/content-models')) {
      return Promise.resolve(response(overrides.model ?? MODEL_RESPONSE));
    }
    if (url.includes('/v1/cms/public/categories')) {
      return Promise.resolve(response(overrides.categories ?? CATEGORIES_RESPONSE));
    }
    if (url.includes('/v1/cms/public/posts')) {
      return Promise.resolve(response({ items, has_more: false, next_cursor: null }));
    }
    throw new Error(`예상하지 못한 CMS 요청: ${url}`);
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('ROOTTALE_API_KEY', 'test-api-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://api.example.test');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('FAQ 원장·분류 조회', () => {
  test('분류 트리와 글을 한 응답으로 함께 돌려준다', async () => {
    installCmsResponses([post('mri-normal', 'MRI가 정상인데 목이 아픈가요?')]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.taxonomy.sections.map((section) => section.slug)).toEqual(['spine']);
    expect(result.data.taxonomy.topics.map((topic) => topic.slug)).toEqual(['neck-pain']);
    expect(result.data.archive.entries[0]).toMatchObject({
      sectionSlug: 'spine',
      topicSlug: 'neck-pain',
      topicName: '목 통증',
      slug: 'mri-normal',
      source: 'cms',
    });
  });

  test('비밀값이 없으면 CMS를 부르지 않고 unconfigured다', async () => {
    vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
    await expect(loadFaqCatalog()).resolves.toEqual({ ok: false, reason: 'unconfigured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('faq 모델이 없거나 계약이 다르면 no-model이다 — 빈 목록으로 낮추지 않는다', async () => {
    installCmsResponses([], { model: { models: [] } });
    await expect(loadFaqCatalog()).resolves.toEqual({ ok: false, reason: 'no-model' });

    installCmsResponses([], {
      model: { models: [{ key: 'faq', presentation: { kind: 'category_tree', basePath: '/qa', categoryDepth: 2 } }] },
    });
    await expect(loadFaqCatalog()).resolves.toEqual({ ok: false, reason: 'no-model' });
  });

  test('CMS 장애는 upstream이고 성공한 빈 목록은 권위 있는 부재다', async () => {
    fetchMock.mockRejectedValue(new Error('네트워크 실패'));
    await expect(loadFaqCatalog()).resolves.toEqual({ ok: false, reason: 'upstream' });

    installCmsResponses([]);
    const result = await loadFaqCatalog();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries).toEqual([]);
    expect(result.data.taxonomy.sections).toHaveLength(1);
  });

  test('말단 분류가 하나가 아닌 글과 핵심 답변이 없는 글은 주소를 만들 수 없어 빠진다', async () => {
    installCmsResponses([
      { ...post('two-categories', '분류 두 개'), terms: [
        { id: 'top-neck', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' },
        { id: 'sec-spine', taxonomy: 'category', slug: 'spine', name: '척추 통증' },
      ] },
      { ...post('parent-only', '부모 분류만'), terms: [
        { id: 'sec-spine', taxonomy: 'category', slug: 'spine', name: '척추 통증' },
      ] },
      { ...post('no-excerpt', '핵심 답변 없음'), excerpt: null },
      post('ok', '정상 질문'),
    ]);

    const result = await loadFaqCatalog();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries.map((entry) => entry.slug)).toEqual(['ok']);
  });

  test('display_order가 목록 순서를 정하고 없는 글은 뒤로 간다', async () => {
    installCmsResponses([
      post('third', '세 번째'),
      post('first', '첫 번째', '본문', { display_order: 1 }),
      post('second', '두 번째', '본문', { display_order: 2 }),
    ]);

    const result = await loadFaqCatalog();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries.map((entry) => entry.slug)).toEqual(['first', 'second', 'third']);
  });

  test('clinic_perspective 필드를 살균해 마디클리닉 관점으로 전달한다', async () => {
    installCmsResponses([post('ok', '질문', '본문', {
      clinic_perspective: '<p>진료실에서는 자세를 함께 봅니다.<script>alert(1)</script></p>',
    })]);

    const result = await loadFaqCatalog();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries[0]?.clinicPerspectiveHtml).toContain('자세를 함께 봅니다.');
    expect(result.data.archive.entries[0]?.clinicPerspectiveHtml).not.toContain('<script');
  });
});

describe('FAQ 예약 내부 링크 발행 전환', () => {
  test('예약 대상이 공개 원장에 없으면 본문에 404 링크를 만들지 않는다', async () => {
    installCmsResponses([post('source', '출발 질문', INTERNAL_TOKEN)]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries[0]?.bodyHtml).toContain('MRI가 정상인 목 통증</span>');
    expect(result.data.archive.entries[0]?.bodyHtml).not.toContain('href=');
  });

  test('예약 대상이 발행 목록에 들어오면 출발 본문의 같은 문구가 자동으로 연결된다', async () => {
    installCmsResponses([
      post('source', '출발 질문', INTERNAL_TOKEN),
      post('mri-normal', 'MRI가 정상인 목 통증 질문'),
    ]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries[0]?.bodyHtml).toContain(
      '<a href="/faq/spine/neck-pain/mri-normal">MRI가 정상인 목 통증</a>',
    );
  });

  test('HTML 입력 본문도 오래된 body_html 대신 발행 원장에서 예약 링크를 해석한다', async () => {
    installCmsResponses([
      importedHtmlPost('source', '출발 질문', `<section><p>${INTERNAL_TOKEN}</p></section>`),
      post('mri-normal', 'MRI가 정상인 목 통증 질문'),
    ]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries[0]?.bodyHtml).toContain(
      '<a href="/faq/spine/neck-pain/mri-normal">MRI가 정상인 목 통증</a>',
    );
    expect(result.data.archive.entries[0]?.bodyHtml).not.toContain('오래된 HTML 파생값');
  });

  test('공개 FAQ 선택(관계 필드)은 공개 API가 풀어 준 글 객체에서 ID를 읽는다', async () => {
    installCmsResponses([
      post('source', '출발 질문', '일반 본문', {
        related_faqs: [{ id: 'post-picked', title: '고른 질문', slug: 'picked', type: 'post' }],
      }),
      post('picked', '고른 질문'),
    ]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const entries = result.data.archive.entries;
    expect(entries[0]?.relatedContentIds).toEqual(['post-picked']);
    expect(relatedFaqEntries(entries, entries[0]!).map((entry) => entry.slug)).toEqual(['picked']);
  });

  test('관련 콘텐츠는 공통 패널(related_posts)이 정본이고 없을 때만 옛 모델 필드를 읽는다', async () => {
    installCmsResponses([
      {
        ...post('panel', '패널로 고른 질문', '본문', {
          related_faqs: [{ id: 'post-legacy', title: '옛 필드', slug: 'legacy', type: 'post' }],
        }),
        related_posts: [{ id: 'post-new', title: '공통 패널', slug: 'new' }],
      },
      post('legacy-only', '옛 필드만 있는 질문', '본문', {
        related_faqs: [{ id: 'post-legacy', title: '옛 필드', slug: 'legacy', type: 'post' }],
      }),
      post('new', '패널 대상'),
      post('legacy', '옛 필드 대상'),
    ]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const bySlug = new Map(result.data.archive.entries.map((entry) => [entry.slug, entry]));
    expect(bySlug.get('panel')?.relatedContentIds).toEqual(['post-new']);
    expect(bySlug.get('legacy-only')?.relatedContentIds).toEqual(['post-legacy']);
  });

  test('본문 예약 키를 역참조 갱신용 메타로 전달한다', async () => {
    installCmsResponses([post('source', '출발 질문', INTERNAL_TOKEN)]);

    const result = await loadFaqCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archive.entries[0]?.referencedContentKeys)
      .toEqual(['faq.spine.neck-pain.mri-normal']);
  });
});

test('공개 API의 원문 출처가 FAQ 표시 모델까지 전달된다', async () => {
  const copiedFrom = { name: 'headnerve', url: 'https://headnerve.com/faq/example' };
  installCmsResponses([{ ...post('copied', '복사 질문'), meta_json: { copiedFrom } }]);
  const result = await loadFaqCatalog();
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.data.archive.entries[0]?.copiedFrom).toEqual(copiedFrom);
});
