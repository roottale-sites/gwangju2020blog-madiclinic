import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import ReviewFaq from './ReviewFaq';

describe('후기 FAQ 표시', () => {
  test('질문 영역임을 알리는 FAQ 표기와 제목을 함께 렌더링한다', () => {
    const html = renderToStaticMarkup(createElement(ReviewFaq, {
      items: [{ question: '질문', answer: '답변' }],
    }));

    expect(html).toContain('class="review-detail__faq-heading"');
    expect(html).toContain('<p aria-hidden="true">FAQ</p>');
    expect(html).toContain('<h2 id="review-faq-title">자주 묻는 질문</h2>');
  });

  test('질문이 없으면 빈 영역을 만들지 않는다', () => {
    expect(renderToStaticMarkup(createElement(ReviewFaq, { items: [] }))).toBe('');
  });
});
