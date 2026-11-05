import { expect, test } from 'vitest';
import { articleJsonLd } from './schema';

const article = {
  path: '/column/headache/example',
  headline: '칼럼 제목',
  description: '칼럼 설명',
  publishedAt: '2026-09-22T00:00:00Z',
};

test('Article은 수정 시각·분류·한국어 언어 정보를 제공한다', () => {
  expect(articleJsonLd({
    ...article,
    updatedAt: '2026-11-05T00:00:00Z',
    section: '두통',
  })).toMatchObject({
    datePublished: article.publishedAt,
    dateModified: '2026-11-05T00:00:00Z',
    articleSection: '두통',
    inLanguage: 'ko-KR',
  });
});

test.each([undefined, ''])('수정 시각·분류가 %s이면 생략하고 언어는 유지한다', (value) => {
  const node = articleJsonLd({ ...article, updatedAt: value, section: value });
  expect(node).not.toHaveProperty('dateModified');
  expect(node).not.toHaveProperty('articleSection');
  expect(node).toHaveProperty('inLanguage', 'ko-KR');
  expect(node).toHaveProperty('datePublished', article.publishedAt);
});
