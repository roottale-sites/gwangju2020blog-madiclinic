import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import ArchivePagination from './ArchivePagination';

const render = (page: number, pageCount: number) => renderToStaticMarkup(<ArchivePagination
  label="목록 페이지" page={page} pageCount={pageCount} hrefForPage={(value) => `/list?page=${value}`} />);

describe('공통 목록 페이지네이션', () => {
  test('첫 페이지 이전과 마지막 페이지 다음은 누를 수 없다', () => {
    const first = render(1, 3);
    const last = render(3, 3);
    expect(first).not.toContain('rel="prev"');
    expect(first).toMatch(/<a(?=[^>]*href="\/list\?page=2")(?=[^>]*rel="next")[^>]*>/);
    expect(last).toMatch(/<a(?=[^>]*href="\/list\?page=2")(?=[^>]*rel="prev")[^>]*>/);
    expect(last).not.toContain('rel="next"');
  });

  test('한 페이지만 있어도 현재 위치를 표시한다', () => {
    const html = render(1, 1);
    expect(html).toContain('aria-current="page" aria-label="1페이지"');
    expect(html).not.toContain('<a');
  });

  test('많은 페이지도 현재 위치 주변 다섯 개 번호만 표시한다', () => {
    const html = render(50, 100);
    expect(html.match(/<li>/g)).toHaveLength(5);
    expect(html).toContain('aria-label="48페이지"');
    expect(html).toContain('aria-label="52페이지"');
    expect(html).toContain('aria-current="page" aria-label="50페이지"');
  });
});
