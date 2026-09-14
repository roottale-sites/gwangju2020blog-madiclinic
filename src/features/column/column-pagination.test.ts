import { describe, expect, test } from 'vitest';

import type { ColumnArchiveEntry } from './column-model';
import {
  COLUMN_ENTRIES_PER_PAGE,
  columnArchiveUrl,
  paginateColumnEntries,
  parseColumnPageNumber,
} from './column-pagination';

function entries(count: number): ColumnArchiveEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    slug: `column-${index + 1}`,
    title: `칼럼 ${index + 1}`,
    description: `칼럼 ${index + 1} 설명`,
    publishedAt: `2026-08-${String((index % 28) + 1).padStart(2, '0')}T00:00:00+09:00`,
    category: { slug: 'knee', name: '무릎', path: '/column/knee' },
  }));
}

describe('칼럼 목록 페이지', () => {
  test('한 페이지에 10건씩 보여 준다', () => {
    const page = paginateColumnEntries(entries(25), 2);

    expect(COLUMN_ENTRIES_PER_PAGE).toBe(10);
    expect(page).toMatchObject({ page: 2, pageCount: 3, total: 25 });
    expect(page.items.map((entry) => entry.slug)).toEqual(
      Array.from({ length: 10 }, (_, index) => `column-${index + 11}`),
    );
  });

  test('범위를 벗어난 페이지는 실제 마지막 페이지로 낮춘다', () => {
    const page = paginateColumnEntries(entries(25), 99);

    expect(page.page).toBe(3);
    expect(page.items).toHaveLength(5);
  });

  test('온전한 양의 정수만 페이지 번호로 허용한다', () => {
    expect(parseColumnPageNumber('2')).toBe(2);
    expect(parseColumnPageNumber('2x')).toBe(1);
    expect(parseColumnPageNumber('-1')).toBe(1);
    expect(parseColumnPageNumber(null)).toBe(1);
  });

  test('페이지와 검색어를 공유 가능한 GET URL로 만든다', () => {
    expect(columnArchiveUrl(1, '')).toBe('/column#column-list-title');
    expect(columnArchiveUrl(2, '')).toBe('/column?page=2#column-list-title');
    expect(columnArchiveUrl(1, '편두통 치료')).toBe('/column?q=%ED%8E%B8%EB%91%90%ED%86%B5+%EC%B9%98%EB%A3%8C#column-list-title');
    expect(columnArchiveUrl(3, '편두통 치료')).toBe('/column?q=%ED%8E%B8%EB%91%90%ED%86%B5+%EC%B9%98%EB%A3%8C&page=3#column-list-title');
  });

});
