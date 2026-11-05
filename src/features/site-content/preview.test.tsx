import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import Page, { metadata } from '../../app/preview/content/[id]/page';
import RootLayout, { generateMetadata } from '../../app/layout';
import { proxy } from '../../proxy';
import { reviewFixture } from '../reviews/review-fixture';
import { initialContent } from './fixtures';
import receipt from '../../../cms/content-runtime-receipt.json';
const { fetchPreview, loadContent, headerValues, verification } = vi.hoisted(() => ({
  fetchPreview: vi.fn(), loadContent: vi.fn(), verification: vi.fn(), headerValues: { preview: true },
}));
vi.mock('@roottale/cms-client/server', async original => ({ ...await original<typeof import('@roottale/cms-client/server')>(), fetchPostPreview: fetchPreview }));
vi.mock('./source', async original => ({ ...await original<typeof import('./source')>(), loadSiteContent: loadContent }));
vi.mock('../seo/site-verification', () => ({ loadSiteVerification: verification }));
vi.mock('next/headers', () => ({ headers: async () => new Headers(headerValues.preview ? { 'x-madi-preview': '1' } : {}) }));
vi.mock('../../components/site/SiteLayout', () => ({ default: () => <div>공개 헤더·팝업</div> }));
vi.mock('../analytics/RootAnalytics', () => ({ RootAnalytics: () => <div>공개 분석</div> }));
const content = initialContent('column-footer');
const document = content.documents.find(doc => doc.modelKey === 'column-footer')!;
function post() {
  return { ...reviewFixture(), id: document.id, modelKey: document.modelKey, fields: document.fields,
    preview: { visualTarget: { entityId: document.id, draftId: 'fixture-draft', draftVersion: 1,
      contractVersion: receipt.contractVersion, templateVersion: receipt.templateVersion } } };
}
const props = (id = document.id, token: string | string[] | undefined = 'fixture-token') => ({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ token }) });
beforeEach(() => { vi.stubEnv('ROOTTALE_API_KEY','fixture-key'); fetchPreview.mockReset().mockResolvedValue(post()); loadContent.mockReset(); verification.mockReset(); });
afterEach(() => { vi.unstubAllEnvs(); });
test.each([undefined, '', ['fixture-token']])('토큰 누락·배열은 API 호출 없이 404다: %s', async token => {
  await expect(Page({ params: props().params, searchParams: Promise.resolve({ token }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  expect(fetchPreview).not.toHaveBeenCalled();
});
test('공유 문서 ID와 미리보기 대상 ID가 모두 맞아야 한다', async () => {
  await expect(Page(props('other-id'))).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  const mismatched = post(); mismatched.preview.visualTarget.entityId = 'other-id'; fetchPreview.mockResolvedValue(mismatched);
  await expect(Page(props())).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
});
test('키 누락과 만료·조회 실패도 404이며 비밀값은 출력하지 않는다', async () => {
  vi.stubEnv('ROOTTALE_API_KEY',''); await expect(Page(props())).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  expect(fetchPreview).not.toHaveBeenCalled();
  vi.stubEnv('ROOTTALE_API_KEY','fixture-key'); fetchPreview.mockRejectedValue(new Error('fixture-token'));
  await expect(Page(props())).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
});
test('계약·템플릿 호환성을 확인하고 맞는 문서만 클릭 편집으로 그린다', async () => {
  const html = renderToStaticMarkup(await Page(props()));
  expect(html).toContain('data-rt-edit'); expect(html.match(/class="clinic-guide"/g)).toHaveLength(1);
  expect(html).not.toContain('application/ld+json'); expect(loadContent).not.toHaveBeenCalled();
  const stale = post(); stale.preview.visualTarget.contractVersion = 'stale'; fetchPreview.mockResolvedValue(stale);
  const staleHtml = renderToStaticMarkup(await Page(props()));
  expect(staleHtml).toContain('미리보기 갱신이 필요합니다'); expect(staleHtml).not.toContain('data-rt-edit');
});
test('미리보기 layout에는 공개 푸터·팝업·분석·JSON-LD와 소유 확인 조회가 없다', async () => {
  const html = renderToStaticMarkup(await RootLayout({ children: <main>초안</main> }));
  expect(html).toContain('초안'); expect(html).not.toContain('공개'); expect(html).not.toContain('application/ld+json');
  expect(loadContent).not.toHaveBeenCalled();
  expect((await generateMetadata()).robots).toEqual({ index: false, follow: false }); expect(verification).not.toHaveBeenCalled();
  expect(metadata.robots).toEqual({ index: false, follow: false }); expect(metadata.referrer).toBe('no-referrer');
});
test('미리보기 응답은 no-store·noindex·no-referrer이고 승인된 관리자 iframe만 허용한다', async () => {
  const response = await proxy(new NextRequest('https://site.test/preview/content/id'));
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  expect(response.headers.get('content-security-policy')).toContain('https://admin.roottale.com https://admin.web.ai.kr');
  expect(response.headers.get('x-middleware-request-x-madi-preview')).toBe('1');
  const publicResponse = await proxy(new NextRequest('https://site.test/column', { headers: { 'x-madi-preview': '1' } }));
  expect(publicResponse.headers.get('x-middleware-request-x-madi-preview')).toBeNull();
});

test('글 미리보기는 공유 편집용 헤더·응답 정책을 적용하지 않는다', async () => {
  const response = await proxy(new NextRequest('https://site.test/preview/post/id', { headers: { 'x-madi-preview': '1' } }));
  expect(response.headers.get('x-middleware-request-x-madi-preview')).toBeNull();
  for (const key of ['cache-control','referrer-policy','content-security-policy']) expect(response.headers.get(key)).toBeNull();
  expect(response.headers.get('x-robots-tag')).toBe('noindex, follow');
});
