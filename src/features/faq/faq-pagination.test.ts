import { describe, expect, test } from 'vitest';

import { faqFixtureEntries } from './faq-fixture';
import { faqPaginationUrl, paginateFaqEntries, parseFaqPageNumber } from './faq-pagination';

describe('FAQ 질문 페이지', () => {
  test('분류 순서로 페이지를 나누어 질문 누락·중복 없이 끝까지 볼 수 있다', () => {
    const entries = Array.from({ length: 23 }, (_, index) => ({
      ...faqFixtureEntries[index % faqFixtureEntries.length]!, slug: `q-${index}`,
    }));
    const pages = [1, 2, 3].map((page) => paginateFaqEntries(entries, page));
    expect(pages.map((page) => page.items.length)).toEqual([10, 10, 3]);
    expect(new Set(pages.flatMap((page) => page.items.map((entry) => entry.slug))).size).toBe(23);
    expect(paginateFaqEntries(entries, 99).page).toBe(3);
    expect(paginateFaqEntries([], 2)).toMatchObject({ page: 1, total: 0, items: [] });
  });

  test('잘못된 페이지 번호는 첫 페이지로 처리한다', () => {
    for (const input of [undefined, '0', '-1', '1.5', 'invalid', '999999999999999999']) {
      expect(parseFaqPageNumber(input)).toBe(1);
    }
    expect(parseFaqPageNumber('2')).toBe(2);
    expect(faqPaginationUrl('/faq/a/b', 1)).toBe('/faq/a/b#faq-question-list');
  });
});
