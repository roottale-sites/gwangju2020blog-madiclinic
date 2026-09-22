import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { reviewFixture } from '../reviews/review-fixture';
import { faqFixtureCategories, faqFixtureCollection } from '../faq/faq-fixture';
import { loadPostPreview } from './post-preview';
import PostPreviewRoute, { postPreviewMetadata } from './PostPreviewRoute';

vi.mock('./post-preview', () => ({ loadPostPreview: vi.fn() }));
vi.mock('../faq/faq-wire', async (original) => ({
  ...await original<typeof import('../faq/faq-wire')>(),
  fetchFaqCategories: async () => faqFixtureCategories,
}));
vi.mock('../faq/faq-source', () => ({ resolveFaqCollection: async () => faqFixtureCollection() }));
beforeEach(() => vi.mocked(loadPostPreview).mockReset());

test.each(['column', 'reviews', 'faq'])('%s 미리보기는 해당 공개 상세 화면과 저장 전 본문을 사용한다', async (model) => {
  vi.mocked(loadPostPreview).mockResolvedValue({ kind: 'post', post: {
    ...reviewFixture({ collectionKey: model, modelKey: model, slug: 'draft', title: '검사 전 질문',
      bodyJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '저장 전 본문 확인' }] }] },
      terms: [{ id: 'top-neck', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' }],
      fields: { clinic_perspective: '<p>편집 중인 관점</p>' },
    }),
    preview: { expiresAt: '2026-09-22T01:00:00Z', sourceStatus: 'draft' },
  } });
  const html = renderToStaticMarkup(await PostPreviewRoute({ postId: 'id', token: 'token' }));
  expect(html).toContain('저장 전 본문 확인');
  expect(html).toContain('미리보기');
  expect(html).toContain(model === 'reviews' ? 'review-detail' : model === 'faq' ? 'faq-detail' : 'column-detail');
  if (model === 'faq') expect(html).toContain('편집 중인 관점');
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
