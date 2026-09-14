import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { faqDetailHeadingId, faqDetailOutline, faqDetailSections } from './faq-detail-outline';
import { faqFixtureCollection, faqFixtureEntries } from './faq-fixture';
import FaqDetailPage from './FaqDetailPage';
import { faqSectionBySlug, faqTopicBySlug } from './faq-registry';

const collection = faqFixtureCollection();
const maybeSection = faqSectionBySlug(collection.taxonomy, 'spine');
const maybeTopic = faqTopicBySlug(collection.taxonomy, 'spine', 'neck-pain');
const maybeEntry = faqFixtureEntries.find((item) => item.slug === 'mri-normal');

if (!maybeSection || !maybeTopic || !maybeEntry) throw new Error('FAQ 목차 테스트 픽스처가 없습니다.');

const section = maybeSection;
const topic = maybeTopic;
const entry = maybeEntry;

function render(overrides: Partial<typeof entry>) {
  return renderToStaticMarkup(
    <FaqDetailPage
      collection={collection}
      entry={{ ...entry, ...overrides }}
      section={section}
      topic={topic}
    />,
  );
}

function tocLinks(html: string): string[] {
  const nav = html.match(/<nav aria-label="답변 구성 목차">([\s\S]*?)<\/nav>/u)?.[1] ?? '';
  return Array.from(nav.matchAll(/<a href="#([^"]+)"><span>([^<]+)<\/span><\/a>/gu), (m) => `${m[1]}|${m[2]}`);
}

describe('FAQ 상세 답변 구성 목차', () => {
  test('내용이 있는 섹션만 본문 순서대로 고른다', () => {
    expect(faqDetailOutline({ bodyHtml: undefined, clinicPerspectiveHtml: undefined }, 0).map((s) => s.key))
      .toEqual(['question', 'coreAnswer']);
    expect(faqDetailOutline({ bodyHtml: '<p>a</p>', clinicPerspectiveHtml: '<p>b</p>' }, 2).map((s) => s.key))
      .toEqual(['question', 'coreAnswer', 'detailedAnswer', 'clinicPerspective', 'relatedQuestions']);
  });

  test('관점 섹션 제목은 콘텐츠 모델의 필드 라벨과 같다', () => {
    expect(faqDetailSections.clinicPerspective.title).toBe('마디클리닉 관점');
  });

  test('목차는 실제로 렌더된 섹션과 1:1이고, 각 링크는 같은 제목의 헤딩을 가리킨다', () => {
    for (const overrides of [
      { bodyHtml: '<p>상세 설명</p>', clinicPerspectiveHtml: '<p>마디클리닉 관점</p>' },
      { bodyHtml: undefined, clinicPerspectiveHtml: undefined },
    ]) {
      const html = render(overrides);
      // 픽스처의 이 글은 같은 세부 질환에 다른 질문이 하나 있어 관련 질문이 1건이다.
      const expected = faqDetailOutline(overrides, 1);

      expect(tocLinks(html)).toEqual(expected.map((s) => `${s.id}|${s.title}`));
      for (const s of expected) {
        expect(html).toContain(`id="${s.id}"`);
        expect(html).toMatch(new RegExp(`<h3 id="${faqDetailHeadingId(s)}">(Q\\. )?${s.title}</h3>`, 'u'));
      }
    }
  });

  test('본문에 없는 섹션은 목차에도 없다', () => {
    const html = render({ bodyHtml: undefined, clinicPerspectiveHtml: undefined });
    expect(html).not.toContain(`id="${faqDetailSections.detailedAnswer.id}"`);
    expect(tocLinks(html).some((l) => l.startsWith(`${faqDetailSections.detailedAnswer.id}|`))).toBe(false);
    expect(tocLinks(html).some((l) => l.startsWith(`${faqDetailSections.clinicPerspective.id}|`))).toBe(false);
  });
});
