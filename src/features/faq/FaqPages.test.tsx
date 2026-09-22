import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { faqNotices } from './faq-content';
import { faqFixtureCollection, faqFixtureEntries } from './faq-fixture';
import FaqDetailPage from './FaqDetailPage';
import FaqHomePage from './FaqHomePage';
import FaqSectionPage from './FaqSectionPage';
import FaqStatePage from './FaqStatePage';
import FaqTopicPage from './FaqTopicPage';
import { EMPTY_FAQ_TAXONOMY, faqSectionBySlug, faqTopicBySlug } from './faq-registry';

const collection = faqFixtureCollection();
const section = faqSectionBySlug(collection.taxonomy, 'spine');
const topic = faqTopicBySlug(collection.taxonomy, 'spine', 'neck-pain');
const entry = faqFixtureEntries.find((item) => item.slug === 'mri-normal');

if (!section || !topic || !entry) throw new Error('FAQ 화면 테스트 픽스처가 없습니다.');

const home = () => renderToStaticMarkup(<FaqHomePage collection={collection} />);
const sectionPage = (override = collection) =>
  renderToStaticMarkup(<FaqSectionPage collection={override} section={section} />);
const topicPage = (override = collection, selectedIntent?: Parameters<typeof FaqTopicPage>[0]['selectedIntent']) =>
  renderToStaticMarkup(
    <FaqTopicPage collection={override} section={section} topic={topic} selectedIntent={selectedIntent} />,
  );
const detail = (overrides: Partial<typeof entry> = {}) =>
  renderToStaticMarkup(
    <FaqDetailPage
      collection={collection}
      entry={{ ...entry, ...overrides }}
      section={section}
      topic={topic}
    />,
  );

describe('FAQ 네 단계 화면 골격', () => {
  test('모든 단계가 페이지 골격(배너 03·브레드크럼·본문)을 렌더하고 공통 헤더·푸터를 중복하지 않는다', () => {
    for (const html of [home(), sectionPage(), topicPage(), detail()]) {
      expect(html).not.toContain('id="header"');
      expect(html).toContain('subVisualArea sbnNo03');
      expect(html).toContain('<h2>자주 묻는 질문</h2>');
      expect(html).toContain('class="whereIsLine clearFix"');
      expect(html).toContain('id="main"');
      expect(html).not.toContain('id="bottom"');
    }
  });

  /**
   * 본문 제목은 h2다 — 헤더 로고가 본 사이트 그대로 `h1.ci`(데스크톱)·`h1.logo`
   * (모바일 드로어)이고 그 마크업은 1px 재현 계약이라 바꾸지 않는다. 본 사이트
   * 서브 페이지도 본문 제목을 h2로 쓴다.
   */
  test('페이지 본문은 헤더 로고 h1을 중복하지 않고 h2로 시작한다', () => {
    for (const html of [home(), sectionPage(), topicPage(), detail()]) {
      const headings = html.match(/<h1[^>]*>/gu) ?? [];
      expect(headings).toHaveLength(0);
      expect(html).toMatch(/<h2[^>]*class="faq-(intro__title|detail__title)"|<h2>자주 묻는 질문<\/h2>/u);
    }
  });

  test('headnerve 고유 요소(카페 링크·의사 사진·질환 도판)는 남아 있지 않다', () => {
    for (const html of [home(), sectionPage(), topicPage(), detail()]) {
      expect(html).not.toContain('content-cafe-link');
      expect(html).not.toContain('lee-jaesung');
      expect(html).not.toContain('faq-guide-card__visual');
      expect(html).not.toContain('한의원');
    }
  });
});

describe('질문 홈', () => {
  test('CMS 진료 영역마다 이미지 없는 카드와 질문 수를 렌더한다', () => {
    const html = home();

    expect(html.match(/class="faq-section-card"/gu)).toHaveLength(2);
    expect(html).toContain('<h3>척추 통증</h3>');
    expect(html).toContain('<h3>관절 통증</h3>');
    expect(html).toContain('href="/faq/spine"');
    expect(html).toContain('질문 3개');
    expect(html).toContain('질문 1개');
    // 카드 안에는 도판이 없다. headnerve는 여기에 질환 이미지 5장을 썼다.
    const grid = html.slice(html.indexOf('class="faq-section-grid"'), html.indexOf('</main>'));
    expect(grid).not.toContain('<img');
    expect(grid).not.toContain('figure');
  });

  test('분류가 0건이면 빈 화면이 아니라 안내 문구가 나온다', () => {
    const html = renderToStaticMarkup(
      <FaqHomePage collection={faqFixtureCollection({ taxonomy: EMPTY_FAQ_TAXONOMY })} />,
    );

    expect(html).toContain(faqNotices.emptySections);
    expect(html).not.toContain('class="faq-section-card"');
  });

  test.each(['unconfigured', 'no-model', 'upstream'] as const)(
    '%s 상태에서는 사유를 밝히는 안내 문구가 골격 안에 나온다',
    (status) => {
      const html = renderToStaticMarkup(
        <FaqHomePage
          collection={faqFixtureCollection({
            status,
            taxonomy: EMPTY_FAQ_TAXONOMY,
            archive: { source: 'fallback', entries: [] },
          })}
        />,
      );

      expect(html).toContain('class="faq-notice"');
      expect(html).toContain(faqNotices[status]);
      expect(html).toContain('id="main"');
    },
  );
});

describe('진료 영역 화면', () => {
  test('CMS 세부 질환을 순서대로, 질문 수와 첫 질문 미리보기와 함께 렌더한다', () => {
    const html = sectionPage();

    expect(html).not.toContain('class="faq-intro__title"');
    expect(html.match(/class="faq-topic-list"/gu)).toHaveLength(1);
    expect(html.indexOf('href="/faq/spine/neck-pain"')).toBeLessThan(html.indexOf('href="/faq/spine/disc"'));
    expect(html).toContain('<strong>목 통증</strong>');
    expect(html).toContain('MRI가 정상인데 목이 계속 아플 수 있나요?');
    expect(html).toContain('척추 통증 질문 목차');
    expect(html).toContain('이경무 대표원장');
  });

  test('세부 질환이 없으면 안내 문구가 나온다', () => {
    const html = sectionPage(faqFixtureCollection({
      taxonomy: { sections: collection.taxonomy.sections, topics: [] },
    }));

    expect(html).toContain(faqNotices.emptyTopics);
    expect(html).not.toContain('class="faq-topic-list"');
  });
});

describe('세부 질환 화면', () => {
  test('질문 성격 필터와 Q·A 목록, 상세 보기 링크를 렌더한다', () => {
    const html = topicPage();

    expect(html).toContain('class="faq-filter"');
    expect(html).toContain('전체 2');
    expect(html).toContain('class="faq-question-list__mark">Q.</span>');
    expect(html).toMatch(/faq-question-list__answer"><b>A\.<\/b><span>/u);
    expect(html).toContain('href="/faq/spine/neck-pain/mri-normal"');
    expect(html).toContain('상세 보기');
    expect(html).toContain('목 통증 질문 목차');
  });

  test('필터는 GET 주소로 상태를 고정하고 고른 성격만 남긴다', () => {
    const html = topicPage(collection, '검사와 진단');

    expect(html).toContain(`?intent=${encodeURIComponent('검사와 진단')}`);
    expect(html).toContain('MRI가 정상인데 목이 계속 아플 수 있나요?');
    expect(html).not.toContain('사무직인데 어떤 자세로 일해야 하나요?');
  });

  test('발행 글이 0건이면 안내 문구가 나온다', () => {
    const html = topicPage(faqFixtureCollection({ archive: { source: 'cms', entries: [] } }));

    expect(html).toContain(faqNotices.emptyEntries);
    expect(html).not.toContain('class="faq-question-list"');
  });
});

describe('답변 상세', () => {
  test('질문 카드·핵심 답변·관련 질문과 진료 안내 박스를 렌더한다', () => {
    const html = detail({ bodyHtml: '<p>상세 설명입니다.</p>' });

    expect(html).toContain('Q. 질문 내용');
    expect(html).toContain('핵심 답변');
    expect(html).toContain('상세 답변');
    expect(html).toContain('같이 많이 묻는 질문');
    expect(html).toContain('사무직인데 어떤 자세로 일해야 하나요?');
    // 칼럼·후기와 같은 진료 안내 박스(.commonBox)를 쓴다.
    expect(html.match(/class="commonBox"/gu)).toHaveLength(1);
    expect(html).toContain('062-675-0750');
  });

  test('답변에만 FAQPage 구조화 데이터를 준다', () => {
    expect(detail()).toContain('FAQPage');
    for (const html of [home(), sectionPage(), topicPage()]) {
      expect(html).not.toContain('FAQPage');
    }
  });

  test('CMS에서 고른 마디클리닉 관점과 관련 FAQ를 우선 렌더한다', () => {
    const related = faqFixtureEntries.find((item) => item.slug === 'how-long');
    if (!related) throw new Error('관련 FAQ 픽스처가 없습니다.');
    const cmsEntry = {
      ...entry,
      clinicPerspectiveHtml: '<p>진료실에서는 자세와 업무 환경을 함께 봅니다.</p>',
      relatedContentIds: [related.contentId!],
    };
    const html = renderToStaticMarkup(
      <FaqDetailPage
        collection={faqFixtureCollection()}
        entry={cmsEntry}
        section={section}
        topic={topic}
      />,
    );

    expect(html).toContain('마디클리닉 관점');
    expect(html).toContain('업무 환경을 함께 봅니다.');
    expect(html).toContain(related.question);
    // 명시 설정이 있으면 자동 추천으로 대체하지 않는다.
    expect(html).not.toContain('사무직인데 어떤 자세로 일해야 하나요?');
  });

  test('미발행 예약 키는 숨기고 대상 발행 뒤 같은 설정으로 연결한다', () => {
    const cmsEntry = { ...entry, relatedContentKeys: ['faq.joint.knee.how-long'] };
    const before = renderToStaticMarkup(
      <FaqDetailPage
        collection={faqFixtureCollection({ archive: { source: 'cms', entries: [cmsEntry] } })}
        entry={cmsEntry}
        section={section}
        topic={topic}
      />,
    );
    expect(before).not.toContain('class="faq-related"');

    const published = faqFixtureEntries.find((item) => item.slug === 'how-long')!;
    const after = renderToStaticMarkup(
      <FaqDetailPage
        collection={faqFixtureCollection({ archive: { source: 'cms', entries: [cmsEntry, published] } })}
        entry={cmsEntry}
        section={section}
        topic={topic}
      />,
    );
    expect(after).toContain('class="faq-related"');
    expect(after).toContain(published.question);
  });
});

describe('CMS를 읽지 못하는 하위 단계', () => {
  test.each(['unconfigured', 'no-model', 'upstream'] as const)(
    '%s 상태의 하위 주소는 404가 아니라 골격 안 상태 안내다',
    (status) => {
      const html = renderToStaticMarkup(
        <FaqStatePage pathname="/faq/spine/neck-pain" status={status} />,
      );

      expect(html).toContain('subVisualArea sbnNo03');
      expect(html).toContain('자주 묻는 질문을 불러오지 못했습니다');
      expect(html).toContain(faqNotices[status]);
      expect(html).toContain('href="/faq"');
    },
  );
});
