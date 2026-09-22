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


describe('블로그 데이터 안내', () => {
  test.each([
    ['unconfigured', '블로그 준비 중입니다'],
    ['upstream', '지금은 글 목록을 불러올 수 없습니다'],
  ] as const)('%s 상태는 빈 목록과 중복하지 않는다', (sourceStatus, message) => {
    const html = renderToStaticMarkup(createElement(ColumnArchiveSearch, {
      entries: [], searchQuery: '', requestedPage: 1, categoryNavigation: null, sourceStatus,
    }));
    expect(html).toContain(message);
    expect(html).not.toContain('새로운 글을 준비하고 있습니다');
    expect(html).not.toContain('총 0건');
    expect(html).toContain('블로그 검색 열기');
  });
});

describe('블로그 검색 해제와 페이지 이동', () => {
  const entries = Array.from({ length: 23 }, (_, index) => ({ ...entry, slug: `entry-${index}`, title: `테스트 글 ${index}` }));

  test.each(['테스트', '없는 검색어'])('검색 결과 유무와 관계없이 %s 검색을 해제할 수 있다', (searchQuery) => {
    const html = renderToStaticMarkup(<ColumnArchiveSearch entries={entries} searchQuery={searchQuery}
      requestedPage={2} basePath="/column/knee" categoryNavigation={null} />);
    expect(html).toContain('href="/column/knee#column-list-title"');
    expect(html.match(/전체 글 보기/g)).toHaveLength(1);
  });

  test('검색된 목록을 10건씩 나누고 다음 페이지 링크에 검색어와 분류를 유지한다', () => {
    const html = renderToStaticMarkup(<ColumnArchiveSearch entries={entries} searchQuery="테스트"
      requestedPage={2} basePath="/column/knee" categoryNavigation={null} />);
    expect(html.match(/class="column-card"/g)).toHaveLength(10);
    expect(html).toContain('aria-current="page" aria-label="2페이지"');
    expect(html).toContain('/column/knee?q=%ED%85%8C%EC%8A%A4%ED%8A%B8&amp;page=3#column-list-title');
    expect(html).not.toContain('테스트 글 0</');
  });

  test('한 페이지일 때도 현재 페이지를 표시하고 빈 검색 결과에서는 숨긴다', () => {
    const render = (searchQuery: string) => renderToStaticMarkup(<ColumnArchiveSearch entries={[entry]}
      searchQuery={searchQuery} requestedPage={1} categoryNavigation={null} />);
    expect(render('')).toContain('aria-label="블로그 페이지"');
    expect(render('없음')).not.toContain('aria-label="블로그 페이지"');
  });
});
