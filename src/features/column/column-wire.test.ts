import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { columnEntryFromPost } from './column-model';
import {
  columnArchivePost,
  columnPostFromWire,
  fetchColumnCategories,
  fetchColumnPostBySlug,
  fetchColumnPostsPage,
  type ColumnWireConfig,
} from './column-wire';

/**
 * 와이어 계약 회귀 테스트.
 *
 * 이 파일의 존재 이유는 하나다 — 공용 클라이언트의 `fromWire`가 `body_html`을
 * 버리기 때문에 칼럼만 직접 와이어를 읽는다. 그래서 "본문이 실제로 도착하는가"를
 * 매핑 단계와 조회 단계 양쪽에서 고정한다. 매핑에서 `body_html`을 떨어뜨리면
 * 아래 테스트들이 깨져야 한다.
 */
const config: ColumnWireConfig = { apiKey: 'rtlk_cust_test', baseUrl: 'https://api.example.com' };

const SERVER_HTML = '<p>서버가 만든 본문</p>';

function wirePost(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '0193-post',
    type: 'post',
    collection_key: 'column',
    slug: 'wire-slug',
    title: '와이어 글',
    excerpt: '발췌',
    published_at: '2026-08-09T00:00:00+09:00',
    updated_at: '2026-08-10T00:00:00+09:00',
    featured_media_url: 'https://cdn.example.com/column-cover.webp',
    body_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JSON 본문' }] }] },
    body_html: SERVER_HTML,
    meta_json: {},
    terms: [{ taxonomy: 'category', slug: 'knee', name: '무릎' }],
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const fetchMock = vi.fn();

/**
 * 호출마다 새 Response를 만든다. 같은 인스턴스를 재사용하면 두 번째 호출에서
 * 본문이 이미 소비돼 "Body is unusable"로 죽는다(테스트 전용 함정).
 */
function respondWith(body: unknown, status = 200): void {
  fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(body, status)));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('와이어 매핑', () => {
  test('body_html을 bodyHtml로 옮긴다', () => {
    // 공용 클라이언트가 버리는 바로 그 필드. 여기가 이 모듈의 존재 이유다.
    expect(columnPostFromWire(wirePost()).bodyHtml).toBe(SERVER_HTML);
  });

  test('body_html이 없으면 null이다', () => {
    expect(columnPostFromWire(wirePost({ body_html: undefined })).bodyHtml).toBeNull();
    expect(columnPostFromWire(wirePost({ body_html: null })).bodyHtml).toBeNull();
  });

  test('칼럼이 쓰는 나머지 필드도 스네이크케이스에서 옮긴다', () => {
    const post = columnPostFromWire(wirePost());

    expect(post).toMatchObject({
      id: '0193-post',
      type: 'post',
      collectionKey: 'column',
      slug: 'wire-slug',
      title: '와이어 글',
      excerpt: '발췌',
      publishedAt: '2026-08-09T00:00:00+09:00',
      updatedAt: '2026-08-10T00:00:00+09:00',
      featuredImageUrl: 'https://cdn.example.com/column-cover.webp',
    });
    expect(post.bodyJson).toHaveProperty('type', 'doc');
  });

  test('플랫폼이 저장한 정규 공개 경로 path 를 옮기고, 목록 캐시에도 남긴다 (ADR-0105)', () => {
    const post = columnPostFromWire(wirePost({ path: '/column/headache/wire-slug' }));
    expect(post.path).toBe('/column/headache/wire-slug');
    expect(columnArchivePost(post).path).toBe('/column/headache/wire-slug');
    // 구 서버(미포함)·상세 주소 없음(null)·엉뚱한 값은 모두 "없음"으로 낮춰 폴백 계산에 맡긴다.
    expect(columnPostFromWire(wirePost({ path: undefined })).path).toBeNull();
    expect(columnPostFromWire(wirePost({ path: null })).path).toBeNull();
    expect(columnPostFromWire(wirePost({ path: 'https://evil.example/x' })).path).toBeNull();
  });

  test('대표 이미지는 공개 API 이름인 featured_media_url에서 읽고, 옛 이름은 호환용이다', () => {
    // 2026-08-18 회귀: featured_image_url만 읽어 새 글의 썸네일이 목록에서 사라졌다.
    expect(columnPostFromWire(wirePost({ featured_media_url: undefined })).featuredImageUrl).toBeNull();
    expect(
      columnPostFromWire(wirePost({ featured_media_url: undefined, featured_image_url: 'https://cdn.example.com/legacy.webp' })).featuredImageUrl,
    ).toBe('https://cdn.example.com/legacy.webp');
    expect(columnPostFromWire(wirePost({ featured_media_url: null })).featuredImageUrl).toBeNull();
  });

  test('목록 캐시는 SEO 제목·설명만 좁게 보존한다', () => {
    const archive = columnArchivePost(columnPostFromWire(wirePost({
      meta_json: {
        seo: { title: '검색 제목' },
        internal: { memo: '제외', viewCount: 80 },
      },
    })));

    // 목록 캐시가 커지지 않게, 그리고 비공개 메타데이터가 새지 않게 좁힌다.
    expect(archive.metaJson).toEqual({ seo: { title: '검색 제목' } });
  });
});

describe('목록 조회', () => {
  test('body_html이 표시 모델 본문까지 도달한다', async () => {
    // 조회 → 매핑 → columnEntryFromPost 전 구간. 어디서든 필드를 떨어뜨리면 깨진다.
    respondWith({ items: [wirePost()], has_more: false, next_cursor: null });

    const page = await fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 });
    const entry = columnEntryFromPost(page.items[0]!);

    expect(entry?.bodyHtml).toContain('서버가 만든 본문');
    expect(entry?.bodyHtml).not.toContain('JSON 본문');
  });

  test('컬렉션·타입·limit을 질의 파라미터로 보낸다', async () => {
    respondWith({ items: [], has_more: false, next_cursor: null });

    await fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 });

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.origin + url.pathname).toBe('https://api.example.com/v1/cms/public/posts');
    expect(url.searchParams.get('collection_key')).toBe('column');
    expect(url.searchParams.get('type')).toBe('post');
    expect(url.searchParams.get('limit')).toBe('100');
  });

  test('cursor와 locale은 준 경우에만 붙는다', async () => {
    respondWith({ items: [], has_more: false, next_cursor: null });

    await fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 });
    const withoutOptional = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(withoutOptional.searchParams.has('cursor')).toBe(false);
    expect(withoutOptional.searchParams.has('locale')).toBe(false);

    await fetchColumnPostsPage(config, {
      collectionKey: 'column',
      limit: 100,
      cursor: 'c1',
      locale: 'ko',
    });
    const withOptional = new URL(fetchMock.mock.calls[1]![0] as string);
    expect(withOptional.searchParams.get('cursor')).toBe('c1');
    expect(withOptional.searchParams.get('locale')).toBe('ko');
  });

  test('페이지네이션 신호를 그대로 전한다', async () => {
    respondWith({ items: [wirePost()], has_more: true, next_cursor: 'next-1' });

    const page = await fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 });

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('next-1');
  });

  test('성공한 빈 목록은 빈 목록이다', async () => {
    // 권위 있는 "0건". 여기서 예외를 던지면 이관 JSON이 되살아나 통제 불능이 된다.
    respondWith({ items: [], has_more: false, next_cursor: null });

    await expect(
      fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 }),
    ).resolves.toMatchObject({ items: [], hasMore: false });
  });

  test('비정상 응답은 예외로 올린다', async () => {
    respondWith({ message: '서버 오류' }, 500);

    await expect(
      fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 }),
    ).rejects.toThrow('서버 오류');
  });
});

describe('분류 조회', () => {
  test('API가 다른 컬렉션 분류를 함께 반환해도 요청한 column만 남긴다', async () => {
    respondWith({
      categories: [
        { collection_key: 'column', slug: 'knee', name: '무릎', published_post_count: 62 },
        { collection_key: 'reviews', slug: 'headache-review', name: '두통 후기', published_post_count: 10 },
        { collection_key: null, slug: 'global', name: '공통', published_post_count: 1 },
      ],
    });

    const result = await fetchColumnCategories(config, 'column');

    expect(result.map((category) => category.slug)).toEqual(['knee']);
  });
});

describe('상세 조회', () => {
  test('body_html이 표시 모델 본문까지 도달한다', async () => {
    respondWith(wirePost());

    const post = await fetchColumnPostBySlug(config, 'wire-slug');
    const entry = columnEntryFromPost(post!);

    expect(entry?.bodyHtml).toContain('서버가 만든 본문');
    expect(entry?.bodyHtml).not.toContain('JSON 본문');
  });

  test('body_html이 없는 글은 bodyJson으로 렌더링된다', async () => {
    respondWith(wirePost({ body_html: null }));

    const post = await fetchColumnPostBySlug(config, 'wire-slug');
    const entry = columnEntryFromPost(post!);

    expect(entry?.bodyHtml).toContain('<p>JSON 본문</p>');
  });

  test('404는 예외가 아니라 없는 글이다', async () => {
    // 권위 있는 부재. 예외로 바꾸면 CMS에서 지운 글이 이관 JSON으로 되살아난다.
    respondWith({ message: 'not found' }, 404);

    await expect(fetchColumnPostBySlug(config, 'gone')).resolves.toBeNull();
  });

  test('그 밖의 실패는 예외로 올린다', async () => {
    respondWith({ message: '게이트웨이 오류' }, 502);

    await expect(fetchColumnPostBySlug(config, 'wire-slug')).rejects.toThrow('게이트웨이 오류');
  });

  test('한글 슬러그는 퍼센트 인코딩해 보낸다', async () => {
    respondWith(wirePost());

    await fetchColumnPostBySlug(config, '벼락두통');

    expect(fetchMock.mock.calls[0]![0]).toContain(encodeURIComponent('벼락두통'));
  });
});

describe('인증과 키 보호', () => {
  test.each([
    ['목록', () => fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 })],
    ['상세', () => fetchColumnPostBySlug(config, 'wire-slug')],
  ])('%s 요청은 Bearer 헤더로 인증한다', async (_label, call) => {
    respondWith({ items: [], has_more: false, next_cursor: null });

    await call();

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer rtlk_cust_test');
    expect(headers['x-roottale-client']).toBeTruthy();
  });

  test.each([
    ['목록', () => fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 })],
    ['상세', () => fetchColumnPostBySlug(config, 'wire-slug')],
  ])('%s 요청은 API 키를 URL에 싣지 않는다', async (_label, call) => {
    respondWith({ items: [], has_more: false, next_cursor: null });

    await call();

    expect(fetchMock.mock.calls[0]![0]).not.toContain('rtlk_cust_test');
  });

  test('브라우저에서는 실행 자체를 막는다', async () => {
    // 키가 번들에 실리는 사고를 조회 시작 전에 끊는다.
    vi.stubGlobal('window', {});

    await expect(
      fetchColumnPostsPage(config, { collectionKey: 'column', limit: 100 }),
    ).rejects.toThrow(/서버에서만/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('사이트 소유 병원 안내', () => {
  test('구형 API의 슬롯 값은 글 모델로 전달하지 않고 본문은 유지한다', () => {
    const original = columnPostFromWire(wirePost());
    const legacy = columnPostFromWire(wirePost({ pattern_slots: { post_footer: 'another-pattern' } }));
    expect(legacy).toEqual(original);
    expect(legacy).not.toHaveProperty('patternSlots');
    expect(columnEntryFromPost(legacy)).toEqual(columnEntryFromPost(original));
  });
});
