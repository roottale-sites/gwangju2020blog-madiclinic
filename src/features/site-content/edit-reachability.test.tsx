import { renderToStaticMarkup as render } from 'react-dom/server';
import { expect, test } from 'vitest';
import { initialContent } from './fixtures';
import { record, type SiteContent } from './bindings';
import MadiFooter from '../../components/madi/MadiFooter';
import { contentEntityJsonLd } from '../seo/schema';
import { ColumnDetailView } from '../column/ColumnDetailRoute';
import type { ColumnEntry } from '../column/column-model';
import ReviewDetailView from '../reviews/ReviewDetailView';
import { reviewFixture } from '../reviews/review-fixture';
import FaqDetailPage from '../faq/FaqDetailPage';
import { faqFixtureCollection } from '../faq/faq-fixture';
const column: ColumnEntry = { contentId: 'fixture-column', slug: 'fixture', title: '시험 글', description: '설명', bodyHtml: '<p>본문</p>', bodyFormat: 'standard', publishedAt: '2026-09-22T00:00:00Z', category: { name: '시험', slug: 'fixture', path: '/column/fixture' } };

function renderedDetails(content: SiteContent) {
  const navigation = { href: '/column/fixture/other', title: '다른 글' };
  const columnHtml = render(<ColumnDetailView content={content} entry={column} previous={navigation} next={navigation} />);
  const post = reviewFixture({ id: 'review-current', slug: 'current', publishedAt: '2026-11-01T00:00:00Z' });
  const other = reviewFixture({ id: 'review-other', slug: 'other', publishedAt: '2026-10-01T00:00:00Z' });
  post.relatedPosts = [{ id: other.id, title: other.title, slug: other.slug, path: '/reviews/other', type: 'post', modelKey: 'reviews', collectionKey: 'reviews', excerpt: other.excerpt, featuredImageUrl: null, publishedAt: other.publishedAt }];
  const reviewHtml = render(<ReviewDetailView content={content} post={post} archivePosts={[post,other]} />);
  const collection = faqFixtureCollection(); const entry = collection.archive.entries[0]!;
  const section = collection.taxonomy.sections.find(section => section.slug === entry.sectionSlug)!;
  const topic = collection.taxonomy.topics.find(topic => topic.slug === entry.topicSlug && topic.sectionSlug === section.slug);
  const faqHtml = render(<FaqDetailPage content={content} collection={collection} entry={entry} section={section} topic={topic} />);
  return { columnHtml, reviewHtml, faqHtml };
}

test('페이지 공통 문구가 실제 칼럼·후기·FAQ 상세까지 전달된다', () => {
  const content = initialContent(); const document = content.documents.find(doc => doc.modelKey === 'clinic-common')!;
  const shared = document.fields.shared; if (!record(shared) || !record(shared.page_common)) throw new Error('fixture shared 누락');
  const page = shared.page_common;
  for (const key of Object.keys(page)) page[key] = `시험_${key}`;
  const { columnHtml, reviewHtml, faqHtml } = renderedDetails(content);
  for (const key of ['cafe','preferred_source','previous','next','column_list']) expect(columnHtml).toContain(`시험_${key}`);
  for (const key of ['cafe','preferred_source','reviews_list','related_reviews','all_reviews']) expect(reviewHtml).toContain(`시험_${key}`);
  for (const key of ['cafe','preferred_source']) expect(faqHtml).toContain(`시험_${key}`);
  for (const html of [columnHtml,reviewHtml,faqHtml]) expect(html).not.toContain('data-rt-edit');
});
test('공통 이메일·팩스·사업자번호는 푸터와 구조화 데이터가 같은 문서에서 읽는다', () => {
  const content = initialContent(); const shared = content.documents[0]!.fields.shared;
  if (!record(shared) || !record(shared.clinic)) throw new Error('fixture clinic 누락');
  const clinic = shared.clinic; clinic.email = 'changed@example.test'; clinic.fax_display = '062-111-2222'; clinic.business_number = '000-00-00000';
  const html = render(<MadiFooter content={content} />); const graph = JSON.stringify(contentEntityJsonLd(content));
  for (const value of ['changed@example.test','062-111-2222','000-00-00000']) { expect(html).toContain(value); expect(graph).toContain(value); }
});

function textPaths(value: unknown, path: string[] = []): string[][] {
  if (typeof value === 'string') return [path];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) => key === '_id' ? [] : textPaths(item, [...path, key]));
}
test.each(textPaths(initialContent().documents[0]!.fields).map(path => ({ name: path.join('.'), path })))('clinic-common의 $name 칸은 실제 공개 소비처를 갖는다', ({ path }) => {
  const content = initialContent();
  let owner: unknown = content.documents[0]!.fields;
  for (const key of path.slice(0, -1)) owner = owner && typeof owner === 'object' ? Reflect.get(owner, key) : undefined;
  if (!owner || typeof owner !== 'object') throw new Error('fixture 필드 누락');
  const key = path.at(-1)!;
  const previous = String(Reflect.get(owner, key));
  const value = key === 'phone_display' ? '02-1234-5678' : previous.startsWith('https:') ? `https://changed.example.test/${key}` : `changed_${key}`;
  Reflect.set(owner, key, value);
  const output = render(<MadiFooter content={content} />) + Object.values(renderedDetails(content)).join('') + JSON.stringify(contentEntityJsonLd(content));
  expect(output).toContain(value);
});
