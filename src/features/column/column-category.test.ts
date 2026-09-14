import { describe, expect, test } from 'vitest';

import {
  columnCategoryPath,
  columnCategoryRefFromTerms,
  nestedColumnEntryPath,
} from './column-category';

/**
 * 분류 값은 코드에 없다(PLAN.md §4.2). 여기서 고정하는 것은 주소 조립 규칙과
 * "정확히 하나" 계약이다 — headnerve는 같은 자리에서 88건 정적 원장을 검사했다.
 */
describe('칼럼 분류 주소', () => {
  test('한글 분류·글 slug를 퍼센트 인코딩해 3층 주소를 만든다', () => {
    expect(columnCategoryPath('무릎')).toBe('/column/%EB%AC%B4%EB%A6%8E');
    expect(nestedColumnEntryPath('knee', '무릎-통증')).toBe(
      '/column/knee/%EB%AC%B4%EB%A6%8E-%ED%86%B5%EC%A6%9D',
    );
  });
});

describe('글에 붙은 분류 읽기', () => {
  test('분류 term 하나면 이름·slug·주소를 그대로 쓴다', () => {
    expect(
      columnCategoryRefFromTerms([
        { taxonomy: 'tag', slug: 'eswt', name: 'ESWT' },
        { taxonomy: 'category', slug: 'knee', name: '무릎' },
      ]),
    ).toEqual({ slug: 'knee', name: '무릎', path: '/column/knee' });
  });

  test.each([
    ['분류가 없으면', [] as const],
    ['태그만 있으면', [{ taxonomy: 'tag', slug: 'eswt', name: 'ESWT' }] as const],
    [
      '분류가 둘 이상이면',
      [
        { taxonomy: 'category', slug: 'knee', name: '무릎' },
        { taxonomy: 'category', slug: 'shoulder', name: '어깨' },
      ] as const,
    ],
  ])('%s 주소를 만들 수 없으므로 null이다', (_label, terms) => {
    // 모델 계약은 `exactly-one`이다. 깨진 응답을 임의 분류로 보완하면 잘못된
    // 주소가 사이트맵·RSS까지 퍼진다.
    expect(columnCategoryRefFromTerms(terms)).toBeNull();
  });

  test('terms 자체가 없는 예전 캐시 응답도 null이다', () => {
    expect(columnCategoryRefFromTerms(undefined)).toBeNull();
  });
});
