import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { faqFixtureCategories, faqFixtureCollection, faqFixtureEntries } from './faq-fixture';
import { faqEntryFromPost } from './faq-api';
import { faqEntryMetadata } from './faq-metadata';
import { generateMetadata as nestedMetadata } from '../../app/faq/[section]/[topic]/[slug]/page';
import { generateMetadata as topicMetadata } from '../../app/faq/[section]/[topic]/page';
import { generateMetadata as sectionMetadata } from '../../app/faq/[section]/page';
import { resolveFaqCollection, resolveFaqDetailCollection } from './faq-source';

vi.mock('./faq-source', () => ({ resolveFaqCollection: vi.fn(), resolveFaqDetailCollection: vi.fn() }));

beforeEach(() => {
  vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
  vi.mocked(resolveFaqCollection).mockResolvedValue(faqFixtureCollection());
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

test('FAQ 표시 모델로 변환할 때 SEO를 보존하고 질문·핵심 답변은 유지한다', async () => {
  const entry = faqEntryFromPost({
    id: 'faq-test', modelKey: 'faq', collectionKey: 'faq', slug: 'mri-normal',
    path: '/faq/spine/neck-pain/mri-normal', previousSlugs: [],
    title: '원래 질문', excerpt: '원래 핵심 답변', updatedAt: '2026-10-08T00:00:00Z',
    bodyJson: {}, bodyHtml: null, fields: {}, relatedPostIds: [],
    terms: [{ id: 'top-neck', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' }],
    seo: { title: 'CMS 검색 제목', description: 'CMS 검색 설명',
      ogImage: 'https://images.example.test/faq-og.png', ogImageAlt: 'FAQ 안내', noindex: true },
    featuredImageUrl: 'https://images.example.test/featured.png',
  }, faqFixtureCategories);
  expect(entry).toMatchObject({ question: '원래 질문', answer: '원래 핵심 답변' });
  const metadata = await faqEntryMetadata(entry!);
  expect(metadata.title).toEqual({ absolute: 'CMS 검색 제목' });
  expect(metadata.description).toBe('CMS 검색 설명');
  expect(metadata.openGraph).toMatchObject({
    images: [{ url: 'https://images.example.test/faq-og.png', alt: 'FAQ 안내' }],
  });
  expect(metadata.robots).toMatchObject({ index: false });
});

test.each([true, false])('질환 하위 여부(%s)와 관계없이 실제 FAQ 라우트가 SEO를 반영한다', async (nested) => {
  const entry = { ...faqFixtureEntries[0]!, topicSlug: nested ? 'neck-pain' : null,
    seo: { title: '개별 검색 제목', description: '개별 검색 설명' } };
  vi.mocked(resolveFaqDetailCollection).mockResolvedValue({ ...faqFixtureCollection(), entry });
  const metadata = nested
    ? await nestedMetadata({ params: Promise.resolve({ section: 'spine', topic: 'neck-pain', slug: entry.slug }) })
    : await topicMetadata({ params: Promise.resolve({ section: 'spine', topic: entry.slug }), searchParams: Promise.resolve({}) });
  expect(metadata.title).toEqual({ absolute: '개별 검색 제목' });
  expect(metadata.description).toBe('개별 검색 설명');
  expect(metadata.twitter).toMatchObject({ title: '개별 검색 제목', description: '개별 검색 설명' });
  expect(metadata.alternates?.canonical).toBe(nested ? '/faq/spine/neck-pain/mri-normal' : '/faq/spine/mri-normal');
});

test('분류의 완전한 SEO 제목에 사이트 이름을 덧붙이지 않고 필터 색인 제한을 유지한다', async () => {
  const collection = faqFixtureCollection();
  const section = collection.taxonomy.sections[0]!;
  section.seoTitle = '척추 FAQ | 광주 남구 마디클리닉';
  vi.mocked(resolveFaqCollection).mockResolvedValue(collection);
  const metadata = await sectionMetadata({ params: Promise.resolve({ section: section.slug }),
    searchParams: Promise.resolve({ intent: '검사와 진단' }) });
  expect(metadata.title).toEqual({ absolute: '척추 FAQ | 광주 남구 마디클리닉' });
  expect(metadata.robots).toMatchObject({ index: false, follow: true });
});

test('SEO가 없는 글은 기존 질문·답변과 기본 이미지를 사용한다', async () => {
  const entry = faqFixtureEntries[0]!;
  const metadata = await faqEntryMetadata(entry);
  expect(metadata.title).toEqual({ absolute: `${entry.question} | 광주 남구 마디클리닉` });
  expect(metadata.description).toBe(entry.answer);
});
