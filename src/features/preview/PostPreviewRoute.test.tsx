import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { reviewFixture } from '../reviews/review-fixture';
import { faqFixtureCategories, faqFixtureCollection } from '../faq/faq-fixture';
import { NextRequest } from 'next/server';
import RootLayout from '../../app/layout';
import { proxy } from '../../proxy';
import { loadSiteContent } from '../site-content/source';
import { initialContent } from '../site-content/fixtures';
import { record } from '../site-content/bindings';
import { loadPostPreview } from './post-preview';
import PostPreviewRoute, { postPreviewMetadata } from './PostPreviewRoute';

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders.current }));
vi.mock('next/navigation', async original => ({ ...await original<typeof import('next/navigation')>(), usePathname: () => '/preview/post/id' }));
vi.mock('../site-content/source', () => ({ loadSiteContent: vi.fn() }));
vi.mock('../analytics/RootAnalytics', () => ({ RootAnalytics: () => null }));
vi.mock('./post-preview', () => ({ loadPostPreview: vi.fn() }));
vi.mock('../column/column-footer-image', () => ({
  loadColumnFooterImage: async () => ({ src: '/preview-footer.webp', alt: '공통 하단 사진' }),
}));
vi.mock('../faq/faq-wire', async (original) => ({
  ...await original<typeof import('../faq/faq-wire')>(),
  fetchFaqCategories: async () => faqFixtureCategories,
}));
vi.mock('../faq/faq-source', () => ({ resolveFaqCollection: async () => faqFixtureCollection() }));
beforeEach(() => {
  vi.mocked(loadPostPreview).mockReset(); requestHeaders.current = new Headers();
  vi.mocked(loadSiteContent).mockReset().mockResolvedValue(initialContent());
});

test.each(['column', 'reviews', 'faq'])('%s 미리보기는 해당 공개 상세 화면과 저장 전 본문을 사용한다', async (model) => {
  vi.mocked(loadPostPreview).mockResolvedValue({ kind: 'post', post: {
    ...reviewFixture({ collectionKey: model, modelKey: model, slug: 'draft', title: '검사 전 질문',
      bodyJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '저장 전 본문 확인' }] }] },
      terms: [{ id: 'top-neck', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' }],
      fields: { clinic_perspective: '<p>편집 중인 관점</p>' },
    }),
    preview: { expiresAt: '2026-09-22T01:00:00Z', sourceStatus: 'draft' },
  } });
  const content = initialContent();
  const shared = content.documents[0]!.fields.shared;
  if (!record(shared) || !record(shared.clinic) || !record(shared.page_common)) throw new Error('fixture shared 누락');
  shared.clinic.email = 'published@example.test'; shared.page_common.cafe = '발행된 공통 질문';
  const footer = content.documents.find(doc => doc.modelKey === `${model}-footer`)!.fields.footer;
  if (!record(footer) || !record(footer.guide) || !record(footer.guide.clinic)) throw new Error('fixture 하단 누락');
  footer.guide.clinic.guide_name = `발행된 ${model} 안내`;
  vi.mocked(loadSiteContent).mockResolvedValue(content);
  const response = await proxy(new NextRequest('https://site.test/preview/post/id'));
  requestHeaders.current = new Headers(response.headers.get('x-middleware-request-x-madi-preview') ? { 'x-madi-preview': '1' } : {});
  const detail = await PostPreviewRoute({ postId: 'id', token: 'token' });
  const html = renderToStaticMarkup(await RootLayout({ children: detail }));
  expect(html).toContain('id="header"'); expect(html).toContain('id="bottom"');
  expect(html).toContain('data-rt-image-gallery'); expect(html).toContain('published@example.test');
  expect(html).toContain('발행된 공통 질문'); expect(html).toContain(`발행된 ${model} 안내`);
  expect(html).toContain('application/ld+json'); expect(html).not.toContain('data-rt-edit');
  expect(html).toContain('저장 전 본문 확인');
  expect(html).toContain('미리보기');
  expect(html).toContain(model === 'reviews' ? 'review-detail' : model === 'faq' ? 'faq-detail' : 'column-detail');
  if (model === 'faq') expect(html).toContain('편집 중인 관점');
  if (model === 'column') expect(html).toContain('src="/preview-footer.webp"');
  else expect(html).not.toContain('preview-footer.webp');
  expect(await postPreviewMetadata('id', 'token')).toMatchObject({ robots: { index: false, follow: false } });
});

test('분류를 고르지 않은 초안은 404 대신 작성 안내를 보여 준다', async () => {
  vi.mocked(loadPostPreview).mockResolvedValue({ kind: 'post', post: {
    ...reviewFixture({ collectionKey: 'column', terms: [] }),
    preview: { expiresAt: '2026-09-22T01:00:00Z', sourceStatus: 'draft' },
  } });
  const html = renderToStaticMarkup(await PostPreviewRoute({ postId: 'id', token: 'token' }));
  expect(html).toContain('분류');
  expect(html).toContain('선택');
});

test('잘못된 ID·토큰의 metadata에 다른 초안 제목이 들어가지 않는다', async () => {
  vi.mocked(loadPostPreview).mockResolvedValue({ kind: 'missing' });
  expect(await postPreviewMetadata('wrong', 'token')).toEqual({
    title: { absolute: '미리보기' }, robots: { index: false, follow: false },
  });
});

test('만료되거나 교체된 작업본은 새 미리보기 안내와 검색 제외를 유지한다', async () => {
  vi.mocked(loadPostPreview).mockResolvedValue({ kind: 'expired' });
  const html = renderToStaticMarkup(await PostPreviewRoute({ postId: 'id', token: 'old-token' }));
  expect(html).toContain('관리자에서 미리보기를 다시 열어 주세요.');
  expect(await postPreviewMetadata('id', 'old-token')).toMatchObject({
    robots: { index: false, follow: false },
  });
});
