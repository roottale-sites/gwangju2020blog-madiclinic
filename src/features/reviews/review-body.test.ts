import { describe, expect, test } from 'vitest';

import { renderReviewBody, renderReviewBodySections, reviewRelatedCopy } from './review-body';

/**
 * headnerve `review-body.test.ts`를 이 저장소 픽스처로 다시 쓴 것이다. 두 문단
 * 연관 기록 패널을 원문 위치에 남기고 양쪽을 따로 정화하는 계약, FAQ 블록을 본문에서
 * 빼는 계약, 선두 이미지 중복 제거 계약이 핵심이다.
 */
function paragraph(text: string) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

const relatedPanel = [paragraph('▶ 연관 진료 기록'), paragraph('무릎 치료 기록 보기 →')];

describe('연관 기록 패널', () => {
  test('원문 문구를 그대로 읽어 인접 후기로 다시 연결할 수 있게 한다', () => {
    const body = { type: 'doc', content: [paragraph('앞 본문'), ...relatedPanel, paragraph('뒤 본문')] };

    expect(reviewRelatedCopy(body)).toEqual({
      eyebrow: '▶ 연관 진료 기록',
      label: '무릎 치료 기록 보기 →',
    });
  });

  test('패널 앞뒤 본문을 따로 정화해 원문 위치를 지킨다', () => {
    const sections = renderReviewBodySections({
      type: 'doc',
      content: [paragraph('앞 본문'), ...relatedPanel, paragraph('뒤 본문')],
    });

    expect(sections.beforeRelatedHtml).toContain('앞 본문');
    expect(sections.beforeRelatedHtml).not.toContain('뒤 본문');
    expect(sections.afterRelatedHtml).toContain('뒤 본문');
    expect(sections.relatedCopy?.label).toBe('무릎 치료 기록 보기 →');
  });

  test('패널이 없으면 본문 전체가 앞쪽 한 덩어리다', () => {
    const sections = renderReviewBodySections({ type: 'doc', content: [paragraph('본문만')] });

    expect(sections.beforeRelatedHtml).toContain('본문만');
    expect(sections.afterRelatedHtml).toBe('');
    expect(sections.relatedCopy).toBeNull();
  });
});

describe('본문 렌더 경계', () => {
  test('FAQ 블록은 본문에서 빼고 전용 화면(ReviewFaq)에 맡긴다', () => {
    const sections = renderReviewBodySections({
      type: 'doc',
      content: [
        paragraph('본문'),
        {
          type: 'faq',
          content: [{
            type: 'faqItem',
            content: [
              { type: 'faqQuestion', content: [{ type: 'text', text: '질문' }] },
              { type: 'faqAnswer', content: [{ type: 'text', text: '답변' }] },
            ],
          }],
        },
      ],
    });

    expect(sections.beforeRelatedHtml).toContain('본문');
    expect(sections.beforeRelatedHtml).not.toContain('질문');
  });

  test('상단에 따로 크게 보여 주는 선두 이미지는 본문에서 한 번만 나온다', () => {
    const body = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://root-cdn.com/lead.png' } },
        paragraph('본문'),
      ],
    };

    expect(renderReviewBodySections(body, { omitLeadingImage: true }).beforeRelatedHtml)
      .not.toContain('lead.png');
    expect(renderReviewBodySections(body).beforeRelatedHtml).toContain('lead.png');
  });

  test('실행 코드는 본문에 남지 않는다', () => {
    const html = renderReviewBody({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '<script>alert(1)</script>' }] }],
    });

    expect(html).not.toContain('<script');
    expect(html).toContain('alert(1)');
  });
});
