import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ scroll, ...props }: ComponentProps<'a'> & { scroll?: boolean }) => createElement(
    'a',
    { ...props, 'data-scroll': String(scroll) },
  ),
}));

import type { ColumnCategory } from './column-category';
import ColumnCategoryNav from './ColumnCategoryNav';

const categories: readonly ColumnCategory[] = [
  {
    slug: 'knee',
    name: '무릎',
    path: '/column/knee',
    description: '무릎 통증 설명',
    seoTitle: '무릎 통증 글',
    seoDescription: '무릎 통증 글 설명',
    publishedPostCount: 6,
  },
  {
    slug: 'shoulder',
    name: '어깨',
    path: '/column/shoulder',
    description: '어깨 통증 설명',
    seoTitle: '어깨 통증 글',
    seoDescription: '어깨 통증 글 설명',
    publishedPostCount: 4,
  },
  {
    slug: 'drafts',
    name: '준비 중',
    path: '/column/drafts',
    description: '준비 중',
    seoTitle: '준비 중',
    seoDescription: '준비 중',
    publishedPostCount: 0,
  },
];

describe('블로그 분류 탐색', () => {
  test('발행 글이 있는 분류와 전체 글 수를 ROOT-ADMIN 경로로 연결한다', () => {
    const html = renderToStaticMarkup(createElement(ColumnCategoryNav, { categories }));

    expect(html).toContain('aria-label="전체 10건"');
    expect(html).toContain('href="/column/knee"');
    expect(html).toContain('href="/column/shoulder"');
    expect(html).not.toContain('/column/drafts');
    expect(html).toContain('href="/column" aria-current="page"');
    expect([...html.matchAll(/data-scroll="false"/g)]).toHaveLength(3);
  });

  test('현재 분류 허브를 aria-current로 표시한다', () => {
    const html = renderToStaticMarkup(createElement(ColumnCategoryNav, {
      categories,
      activeCategorySlug: 'shoulder',
    }));

    expect(html).toContain('href="/column/shoulder" aria-current="page"');
    expect(html).not.toContain('href="/column" aria-current="page"');
  });
});
