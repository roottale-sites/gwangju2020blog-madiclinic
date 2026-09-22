import { describe, expect, test } from 'vitest';

import { reviewFixture as review } from './review-fixture';
import {
  filterReviews,
  isReviewPost,
  paginateReviews,
  parsePageNumber,
  reviewCategories,
  reviewEntryPath,
  reviewExcerpt,
  reviewImageUrl,
  reviewLeadImageUrl,
  reviewMetadata,
  reviewSeoDescription,
  reviewSeoTitle,
  reviewTitle,
  searchReviews,
} from './review-model';

/**
 * headnerve `review-model.test.ts`를 이 저장소 픽스처로 다시 쓴 것이다. 필드
 * 이름 후보·주소 계산·페이지네이션 계약은 그대로고, 문구와 대표원장만 마디클리닉
 * 기준이다.
 */
describe('후기 표시 모델', () => {
  test('ROOT-ADMIN 커스텀 필드와 분류를 화면 메타데이터로 바꾼다', () => {
    const post = review({
      fields: { patient_name: '김○○', doctor_name: '이경무 원장', treatment_period: '8주' },
      terms: [{ id: '1', taxonomy: 'category', slug: 'knee', name: '무릎' }],
    });

    expect(reviewMetadata(post)).toEqual({
      patient: '김○○',
      doctor: '이경무 원장',
      treatmentPeriod: '8주',
      category: '무릎',
    });
  });

  test('담당 필드가 없으면 작성자 이름으로 대신한다', () => {
    expect(reviewMetadata(review()).doctor).toBe('이경무 원장');
  });

  test('제목·요약의 긴 대시는 화면 경계에서 지운다', () => {
    const post = review({ title: '무릎—치료 후기', excerpt: '통증—완화' });

    expect(reviewTitle(post)).toBe('무릎치료 후기');
    expect(reviewExcerpt(post)).toBe('통증완화');
  });

  test('후기 글만 후기로 판정한다', () => {
    expect(isReviewPost(review())).toBe(true);
    expect(isReviewPost(review({ collectionKey: 'column' }))).toBe(false);
    expect(isReviewPost(null)).toBe(false);
  });
});

describe('후기 주소', () => {
  test('플랫폼이 저장한 정규 공개 경로를 먼저 읽는다 (ADR-0105)', () => {
    expect(reviewEntryPath({ slug: 'knee-review', path: '/reviews/knee-2026' }))
      .toBe('/reviews/knee-2026');
  });

  test('경로가 없으면 한글 슬러그를 인코딩해 조립한다', () => {
    expect(reviewEntryPath({ slug: '무릎-후기' })).toBe('/reviews/%EB%AC%B4%EB%A6%8E-%ED%9B%84%EA%B8%B0');
  });
});

describe('후기 도판', () => {
  test('대표 이미지가 있으면 그것을 쓴다', () => {
    expect(reviewImageUrl(review({ featuredImageUrl: 'https://root-cdn.com/a.png' })))
      .toBe('https://root-cdn.com/a.png');
  });

  test('대표 이미지가 없으면 본문 첫 사진을 쓴다', () => {
    const post = review({
      bodyJson: {
        type: 'doc',
        content: [{ type: 'image', attrs: { src: 'https://root-cdn.com/body.png' } }],
      },
    });

    expect(reviewImageUrl(post)).toBe('https://root-cdn.com/body.png');
    expect(reviewLeadImageUrl(post)).toBe('https://root-cdn.com/body.png');
  });

  test('본문 첫 노드가 사진이 아니면 선두 이미지는 없다', () => {
    const post = review({
      bodyJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] },
    });

    expect(reviewLeadImageUrl(post)).toBeNull();
  });
});

describe('후기 SEO 문구', () => {
  test('CMS SEO 값이 있으면 그것을 쓴다', () => {
    const post = review({ metaJson: { seo: { title: '검색 제목', description: '검색 설명' } } });

    expect(reviewSeoTitle(post)).toBe('검색 제목');
    expect(reviewSeoDescription(post)).toBe('검색 설명');
  });

  test('SEO 값이 없으면 제목·요약으로 조립하고 사이트 이름을 붙인다', () => {
    expect(reviewSeoTitle(review())).toBe('무릎 치료 후기 | 후기 | 광주 남구 마디클리닉');
    expect(reviewSeoDescription(review())).toBe('무릎 통증 치료 경험담입니다.');
  });

  test('요약도 없으면 목록 설명까지 내려가고 180자를 넘기지 않는다', () => {
    expect(reviewSeoDescription(review({ excerpt: null })))
      .toBe('광주 남구 마디클리닉에서 치료받은 분들이 직접 남긴 치료 경험담입니다.');
    expect(reviewSeoDescription(review({ excerpt: '가'.repeat(300) }))).toHaveLength(180);
  });
});

describe('후기 목록 분류와 페이지', () => {
  test('분류 내 제목·요약 검색 후 결과를 페이지로 나눈다', () => {
    const posts = [
      review({ id: 'knee', title: '무릎 치료 후기', excerpt: '걷기 변화', terms: [{ id: '1', taxonomy: 'category', slug: 'knee', name: '무릎' }] }),
      review({ id: 'head', title: '두통 치료 후기', excerpt: '약 복용 변화', terms: [{ id: '2', taxonomy: 'category', slug: 'head', name: '두통' }] }),
    ];
    expect(searchReviews(posts, '치료 변화').map((post) => post.id)).toEqual(['knee', 'head']);
    expect(searchReviews(filterReviews(posts, '두통'), '약 복용').map((post) => post.id)).toEqual(['head']);
    expect(searchReviews(posts, '없는 검색어')).toEqual([]);
    expect(searchReviews(posts, ' ')).toHaveLength(2);
  });
  test('분류 목록은 중복 없이 모으고 필터는 그 분류만 남긴다', () => {
    const posts = [
      review({ id: 'a', terms: [{ id: '1', taxonomy: 'category', slug: 'knee', name: '무릎' }] }),
      review({ id: 'b', terms: [{ id: '1', taxonomy: 'category', slug: 'knee', name: '무릎' }] }),
      review({ id: 'c', terms: [{ id: '2', taxonomy: 'category', slug: 'spine', name: '척추' }] }),
    ];

    expect(reviewCategories(posts)).toEqual(['무릎', '척추']);
    expect(filterReviews(posts, '척추').map((post) => post.id)).toEqual(['c']);
    expect(filterReviews(posts, null)).toHaveLength(3);
  });

  test('한 페이지에 10건씩 보여 주고 범위를 벗어난 페이지는 마지막으로 낮춘다', () => {
    const posts = Array.from({ length: 25 }, (_, index) => review({ id: `p${index}` }));

    expect(paginateReviews(posts, 1)).toMatchObject({ page: 1, pageCount: 3, total: 25 });
    expect(paginateReviews(posts, 1).items).toHaveLength(10);
    expect(paginateReviews(posts, 99).page).toBe(3);
    expect(paginateReviews(posts, 99).items).toHaveLength(5);
  });

  test('온전한 양의 정수만 페이지 번호로 허용한다', () => {
    expect(parsePageNumber('2')).toBe(2);
    expect(parsePageNumber('0')).toBe(1);
    expect(parsePageNumber('-1')).toBe(1);
    expect(parsePageNumber('두쪽')).toBe(1);
    expect(parsePageNumber(null)).toBe(1);
  });
});
