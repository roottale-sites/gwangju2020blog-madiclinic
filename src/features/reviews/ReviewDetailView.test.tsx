import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import ReviewDetailView from './ReviewDetailView';
import { reviewFixture } from './review-fixture';

const imageBase = 'https://imagedelivery.net/test-account/review-image';
const bodyImage = {
  type: 'image',
  attrs: { src: `${imageBase}/md`, alt: '작성한 후기 사진', caption: '작성한 사진 설명' },
};
const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

function renderReview(content: unknown[], featuredImageUrl: string | null = `${imageBase}/lg`) {
  return renderToStaticMarkup(createElement(ReviewDetailView, {
    post: reviewFixture({ featuredImageUrl, excerpt: null, bodyJson: { type: 'doc', content } }),
  }));
}

function reviewImages(html: string) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((src) => src?.startsWith('https://imagedelivery.net/test-account/'));
}

describe('후기 상세의 CMS 이미지 배치', () => {
  test('대표 이미지와 같은 본문 사진을 글 뒤에 한 번만 표시한다', () => {
    const html = renderReview([paragraph('사진 앞 문단'), bodyImage, paragraph('사진 뒤 문단')]);

    expect(reviewImages(html)).toEqual([`${imageBase}/md`]);
    const imagePosition = html.indexOf(`src="${imageBase}/md"`);
    expect(html.indexOf('사진 앞 문단')).toBeLessThan(imagePosition);
    expect(html.indexOf('사진 뒤 문단')).toBeGreaterThan(imagePosition);
    expect(html).toContain('작성한 사진 설명');
  });

  test.each([`${imageBase}/lg`, null])('대표 이미지가 %s여도 본문 첫 사진과 설명을 보존한다', (featured) => {
    const html = renderReview([bodyImage, paragraph('사진 다음 문단')], featured);

    expect(reviewImages(html)).toEqual([`${imageBase}/md`]);
    expect(html.indexOf(`src="${imageBase}/md"`)).toBeLessThan(html.indexOf('사진 다음 문단'));
    expect(html).toContain('작성한 사진 설명');
    expect(html).not.toContain('환자분이 직접 남긴 후기 원문');
  });

  test('대표 이미지가 본문 사진과 달라도 상세에 추가하지 않는다', () => {
    const html = renderReview([bodyImage], 'https://imagedelivery.net/test-account/thumbnail/lg');

    expect(reviewImages(html)).toEqual([`${imageBase}/md`]);
  });

  test.each([
    { name: '빈 본문', content: [] },
    { name: '텍스트 본문', content: [paragraph('사진 없는 본문')] },
  ])('$name에 대표 이미지를 추가하지 않는다', ({ content }) => {
    const html = renderReview(content);

    expect(reviewImages(html)).toEqual([]);
    expect(html).not.toContain('후기 원문을 이미지로 확인해 주세요.');
  });
});
