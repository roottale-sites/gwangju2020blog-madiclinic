import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import ColumnArchiveSearch from './ColumnArchiveSearch';
import type { ColumnArchiveEntry } from './column-model';

const entry: ColumnArchiveEntry = {
  slug: '테스트-글',
  title: '테스트 글',
  description: '목록 순서를 검증하는 글입니다.',
  publishedAt: '2026-09-14T00:00:00+09:00',
  category: { slug: 'knee', name: '무릎', path: '/column/knee' },
};

describe('블로그 목록 정보 위계', () => {
  test('목록 제목·도구 다음에 분류 탐색, 그 다음에 글 목록을 렌더한다', () => {
    const categoryNavigation = createElement(
      'nav',
      { 'aria-label': '테스트 분류' },
      createElement('a', { href: '/column' }, '전체'),
    );
    const html = renderToStaticMarkup(createElement(ColumnArchiveSearch, {
      entries: [entry],
      searchQuery: '',
      requestedPage: 1,
      categoryNavigation,
    }));

    const headingIndex = html.indexOf('id="column-list-title"');
    const navigationIndex = html.indexOf('aria-label="테스트 분류"');
    const listIndex = html.indexOf('class="column-list__items"');

    expect(headingIndex).toBeGreaterThanOrEqual(0);
    expect(navigationIndex).toBeGreaterThan(headingIndex);
    expect(listIndex).toBeGreaterThan(navigationIndex);
  });
});
