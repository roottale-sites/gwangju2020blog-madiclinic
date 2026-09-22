import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { mainSiteOrigin } from '../../data/nav';
import ReviewCard from './ReviewCard';
import { reviewFixture as review } from './review-fixture';

/** headnerve `ReviewCard.test.ts`를 이 저장소 픽스처·자산으로 다시 쓴 것이다. */
describe('후기 카드', () => {
  test('대표 이미지가 없으면 블로그 목록과 같은 병원 로고를 기본 도판으로 쓴다', () => {
    const markup = renderToStaticMarkup(createElement(ReviewCard, { post: review() }));

    expect(markup).toContain('class="review-card__media"');
    expect(markup).toContain('review-card__brand-logo');
    expect(markup).toContain('src="/madi/img/hi_gwangju2020_20240826.png"');
    expect(markup).toContain('alt=""');
  });

  test('Cloudflare Images 대표 이미지는 md variant와 srcset으로 내보낸다', () => {
    const markup = renderToStaticMarkup(
      createElement(ReviewCard, {
        post: review({ featuredImageUrl: 'https://imagedelivery.net/hash/image-id/lg' }),
      }),
    );

    expect(markup).toContain('src="https://imagedelivery.net/hash/image-id/md"');
    expect(markup).toContain('https://imagedelivery.net/hash/image-id/sm 320w');
  });

  test('대표원장이 담당이면 본 사이트 프로필로 링크하고, 다른 담당자는 글자로 둔다', () => {
    const own = renderToStaticMarkup(
      createElement(ReviewCard, { post: review({ fields: { doctor_name: '이경무 원장' } }) }),
    );
    const other = renderToStaticMarkup(
      createElement(ReviewCard, { post: review({ fields: { doctor_name: '협진 의료진' } }) }),
    );

    expect(own).toContain(`href="${mainSiteOrigin}/doctor/doctor01.html"`);
    expect(own).toContain('이경무 원장');
    expect(other).toContain('협진 의료진');
    expect(other).not.toContain('/doctor/doctor01.html');
  });

  test('제목 링크만 카드 전체로 펼쳐 담당 링크와 겹치지 않는다', () => {
    const markup = renderToStaticMarkup(createElement(ReviewCard, { post: review() }));

    expect(markup).toContain('class="review-card__title-link"');
    expect(markup).not.toContain('class="review-card__link" href=');
  });

  test('분류·발행일·요약을 카드 상단과 본문에 적는다', () => {
    const markup = renderToStaticMarkup(
      createElement(ReviewCard, {
        post: review({ terms: [{ id: '1', taxonomy: 'category', slug: 'knee', name: '무릎' }] }),
      }),
    );

    expect(markup).toContain('무릎');
    expect(markup).toContain('href="/reviews?category=%EB%AC%B4%EB%A6%8E"');
    expect(markup).toContain('2026년 9월 15일');
    expect(markup).toContain('무릎 통증 치료 경험담입니다.');
  });
});

test('후기는 지정 글쓴이만 표시하고 더보기 문구를 생략한다', () => {
  const markup = renderToStaticMarkup(createElement(ReviewCard, { post: review({ metaJson: { copiedFrom: { name: 'headnerve', url: 'https://headnerve.com/reviews/example' } } }) }));
  expect(markup).toContain('<dt class="community-sr-only">글쓴이</dt>');
  expect(markup).toContain(`href="${mainSiteOrigin}/doctor/doctor01.html"`);
  expect(markup).not.toContain('자세히 보기');
  expect(markup).not.toContain('headnerve');
  expect(markup).not.toContain('<dt>담당</dt>');
});
