import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  ColumnPreviewExpiredError,
  fetchColumnPostPreview,
  type ColumnWireConfig,
} from './column-wire';

/**
 * ROOT-ADMIN 미리보기 (ADR-0104) — 관리자 발급 토큰으로 편집 중인 칼럼을 발행
 * 화면과 같은 화면으로 그린다. 여기서는 와이어 조회 계약(주소·no-store·404/410)과
 * 라우트가 지켜야 할 최소 조건(동적 렌더·noindex·토큰 없으면 404·robots)을 고정한다.
 */
const config: ColumnWireConfig = { apiKey: 'rtlk_cust_test', baseUrl: 'https://api.example.com/' };

function wirePreview(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '0193-post',
    type: 'post',
    collection_key: 'column',
    slug: 'editing-slug',
    title: '편집 중인 제목',
    excerpt: '요약',
    published_at: '2026-08-18T02:00:00.000Z',
    updated_at: '2026-08-18T01:00:00.000Z',
    body_json: { type: 'doc', content: [] },
    body_html: null,
    meta_json: {},
    terms: [{ taxonomy: 'category', slug: 'headache', name: '두통' }],
    preview: { expires_at: '2026-08-18T03:00:00.000Z', source_status: 'draft' },
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('미리보기 와이어 조회', () => {
  test('/posts/preview?token= 을 no-store 로 부르고 preview 블록을 옮긴다', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(wirePreview())));
    const post = await fetchColumnPostPreview(config, 'post.123.nonce.sig');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/v1/cms/public/posts/preview');
    expect(parsed.searchParams.get('token')).toBe('post.123.nonce.sig');
    expect(init.cache).toBe('no-store');
    expect(post?.title).toBe('편집 중인 제목');
    expect(post?.preview).toEqual({ expiresAt: '2026-08-18T03:00:00.000Z', sourceStatus: 'draft' });
  });

  test('400(토큰 형식 오류) 도 null — 주소에 아무 문자열이나 들어와도 500 이 아니라 404 다', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ message: 'Request validation failed' }, 400)));
    await expect(fetchColumnPostPreview(config, 'bad')).resolves.toBeNull();
  });

  test('404 → null, 빈 토큰은 요청 없이 null', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ code: 'not_found' }, 404)));
    await expect(fetchColumnPostPreview(config, 'nope')).resolves.toBeNull();
    await expect(fetchColumnPostPreview(config, '  ')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('410 은 만료 오류로 구분된다', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ code: 'preview_expired' }, 410)));
    await expect(fetchColumnPostPreview(config, 'old')).rejects.toBeInstanceOf(ColumnPreviewExpiredError);
  });
});

describe('미리보기 라우트 계약', () => {
  const page = readFileSync(fileURLToPath(new URL('../../app/preview/post/[id]/page.tsx', import.meta.url)), 'utf8');
  const route = readFileSync(fileURLToPath(new URL('./ColumnPreviewRoute.tsx', import.meta.url)), 'utf8');
  const robots = readFileSync(fileURLToPath(new URL('../../../public/robots.txt', import.meta.url)), 'utf8');

  test('항상 동적 렌더이고 토큰 없이는 404', () => {
    expect(page).toContain("export const dynamic = 'force-dynamic'");
    expect(page).toContain('if (!token) notFound();');
  });

  test('발행 화면과 같은 ColumnDetailView 를 쓰고 다른 글의 토큰은 404', () => {
    expect(route).toContain('<ColumnDetailView');
    expect(route).toContain('entry={entry}');
    expect(route).toContain('lookup.post.id !== postId) notFound()');
  });

  test('metadata 는 noindex/nofollow 이고 robots 가 /preview/ 를 막는다', () => {
    expect(route).toContain('robots: { index: false, follow: false }');
    expect(robots).toContain('Disallow: /preview/');
  });
});
