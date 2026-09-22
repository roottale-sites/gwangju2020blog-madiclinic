import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { loadPostPreview } from './post-preview';

const fetchMock = vi.fn();
function previewWire(model: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'draft-id', tenant_id: 'tenant', site_id: 'site', type: 'post',
    collection_key: model, model_key: model, slug: 'editing', title: '저장 전 제목',
    excerpt: '편집 중인 요약', featured_media_id: null, author_id: null,
    body_json: { type: 'doc', content: [] }, body_html: '<p>저장 전 본문</p>', meta_json: {},
    terms: [], fields: { clinic_perspective: '<p>의견</p>' }, status: 'draft',
    related_posts: [{ id: 'related-id', title: '관련 질문', slug: 'related', path: '/faq/spine/neck/related' }],
    published_at: null, created_at: '2026-09-22T00:00:00Z', updated_at: '2026-09-22T00:00:00Z',
    preview: { expires_at: '2026-09-22T01:00:00Z', source_status: 'draft' }, ...overrides,
  };
}
beforeEach(() => {
  vi.stubEnv('ROOTTALE_API_KEY', 'server-test-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.test');
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test.each(['column', 'reviews', 'faq'])('%s의 저장 전 본문·필드·관계·만료 정보를 보존한다', async (model) => {
  fetchMock.mockResolvedValue(Response.json(previewWire(model)));
  const result = await loadPostPreview('draft-id', 'opaque-test-token');
  expect(result).toMatchObject({ kind: 'post', post: {
    collectionKey: model, title: '저장 전 제목', bodyHtml: '<p>저장 전 본문</p>',
    fields: { clinic_perspective: '<p>의견</p>' }, relatedPosts: [{ id: 'related-id' }],
    preview: { expiresAt: '2026-09-22T01:00:00Z' },
  } });
  expect(fetchMock.mock.lastCall?.[1].cache).toBe('no-store');
});

test.each([400, 401, 403, 404])('무효한 미리보기 %s는 찾을 수 없음으로 처리한다', async (status) => {
  fetchMock.mockResolvedValue(Response.json({ code: 'invalid_token' }, { status }));
  expect(await loadPostPreview('draft-id', 'bad')).toEqual({ kind: 'missing' });
});
test('다른 글 ID의 토큰으로 초안 제목도 읽을 수 없다', async () => {
  fetchMock.mockResolvedValue(Response.json(previewWire('column')));
  expect(await loadPostPreview('another-id', 'token')).toEqual({ kind: 'missing' });
});
test('다른 콘텐츠 모델을 잘못된 상세 화면에 표시하지 않는다', async () => {
  fetchMock.mockResolvedValue(Response.json(previewWire('blog')));
  expect(await loadPostPreview('draft-id', 'token')).toEqual({ kind: 'unsupported' });
});
test('만료와 CMS 장애를 구분해 재시도 안내를 제공한다', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ code: 'preview_expired' }, { status: 410 }));
  expect(await loadPostPreview('draft-id', 'token')).toEqual({ kind: 'expired' });
  fetchMock.mockRejectedValueOnce(new Error('network'));
  expect(await loadPostPreview('draft-id', 'token')).toEqual({ kind: 'unavailable' });
});
test('빈 토큰과 미설정 키는 CMS를 조회하지 않는다', async () => {
  expect(await loadPostPreview('draft-id', '')).toEqual({ kind: 'missing' });
  vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
  expect(await loadPostPreview('draft-id', 'token')).toEqual({ kind: 'unavailable' });
  expect(fetchMock).not.toHaveBeenCalled();
});
