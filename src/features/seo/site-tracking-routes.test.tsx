import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ColumnRoute from '../../app/column/[category]/page';
import NestedColumnRoute from '../../app/column/[category]/[slug]/page';
import ReviewRoute from '../../app/reviews/[slug]/page';
import FaqSectionRoute from '../../app/faq/[section]/page';
import FaqTopicRoute from '../../app/faq/[section]/[topic]/page';
import FaqDetailRoute from '../../app/faq/[section]/[topic]/[slug]/page';
import RootLayout from '../../app/layout';
import PostPreviewRoute from '../preview/PostPreviewRoute';
import { faqFixtureCollection } from '../faq/faq-fixture';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'gwangju2020blog.madiclinic.co.kr' }),
}));
vi.mock('../column/column-source', async (original) => ({
  ...await original<typeof import('../column/column-source')>(),
  resolveColumnCategoryArchive: async () => null,
  resolveColumnEntry: async () => null,
}));
vi.mock('../reviews/review-api', () => ({ loadReview: async () => ({ ok: true, data: null }) }));
vi.mock('../faq/faq-source', () => ({
  resolveFaqCollection: async () => faqFixtureCollection(),
  resolveFaqDetailCollection: async () => ({ ...faqFixtureCollection(), entry: undefined }),
}));
vi.mock('../preview/post-preview', () => ({ loadPostPreview: async () => ({ kind: 'expired' }) }));
vi.mock('../../components/site/SiteLayout', () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock('../analytics/RootAnalytics', () => ({ RootAnalytics: () => null }));

const fetchMock = vi.fn();
const params = Promise.resolve({ category: 'missing', slug: 'missing', section: 'missing', topic: 'missing' });
const searchParams = Promise.resolve({});

beforeEach(() => {
  vi.stubEnv('ROOTTALE_API_KEY', 'fixture-key');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockRejectedValue(new Error('404에서는 theme을 조회하면 안 됩니다.'));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

test.each([
  ['칼럼 단일 주소', () => ColumnRoute({ params, searchParams })],
  ['칼럼 분류·상세', () => NestedColumnRoute({ params })],
  ['후기 상세', () => ReviewRoute({ params })],
  ['FAQ 영역', () => FaqSectionRoute({ params, searchParams })],
  ['FAQ 질환·영역 직속 상세', () => FaqTopicRoute({ params, searchParams })],
  ['FAQ 상세', () => FaqDetailRoute({ params })],
] as const)('%s의 실제 404 경계에서 GTM을 출력하지 않는다', async (_, render) => {
  await expect(render()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('루트 layout으로 감싼 404·미리보기에도 고정 GTM이 남지 않는다', async () => {
  const preview = await PostPreviewRoute({ postId: 'draft', token: 'old-token' });
  for (const children of [<main key="404">404</main>, preview]) {
    const html = renderToStaticMarkup(RootLayout({ children }));
    expect(html).not.toContain('googletagmanager.com');
    expect(html).not.toContain('GTM-T7TXDQ88');
  }
});
