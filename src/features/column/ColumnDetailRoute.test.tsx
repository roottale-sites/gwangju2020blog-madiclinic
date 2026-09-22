import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import ColumnDetailRoute from './ColumnDetailRoute';
import type { ColumnEntry } from './column-model';
import { resolveColumnArchive, resolveColumnEntry } from './column-source';

vi.mock('./column-source', () => ({ resolveColumnArchive: vi.fn(), resolveColumnEntry: vi.fn() }));
vi.mock('../../components/madi/MadiPageFrame', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

function entry(slug: string, category = 'headache'): ColumnEntry {
  return {
    contentId: slug, slug, title: slug, description: '', bodyHtml: '', bodyFormat: 'standard',
    publishedAt: '2026-09-22T00:00:00Z',
    category: { slug: category, name: category, path: `/column/${category}` },
  };
}

beforeEach(() => {
  vi.mocked(resolveColumnArchive).mockResolvedValue({
    status: 'ok', entries: [entry('newest'), entry('other', 'spine'), entry('middle'), entry('oldest')],
  });
});

async function navigation(slug: string) {
  vi.mocked(resolveColumnEntry).mockResolvedValue(entry(slug));
  const html = renderToStaticMarkup(await ColumnDetailRoute({ slug }));
  return html.match(/<nav class="article-navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
}

test('같은 분류의 이전글·목록·다음글을 순서대로 연결한다', async () => {
  const html = await navigation('middle');
  expect([...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])).toEqual([
    '/column/headache/newest', '/column/headache', '/column/headache/oldest',
  ]);
  expect(html).toContain('rel="prev"');
  expect(html).toContain('rel="next"');
});

test.each([['newest', 'prev', 'next'], ['oldest', 'next', 'prev']])(
  '%s 글의 없는 방향은 링크를 만들지 않는다', async (slug, absent, present) => {
    const html = await navigation(slug);
    expect(html).not.toContain(`rel="${absent}"`);
    expect(html).toContain(`rel="${present}"`);
    expect(html).toContain('블로그 목록');
  },
);

test('현재 글이 공개 목록에서 빠져 있으면 무관한 글을 연결하지 않는다', async () => {
  const html = await navigation('missing');
  expect(html).not.toContain('rel="prev"');
  expect(html).not.toContain('rel="next"');
  expect(html).toContain('href="/column/headache"');
});
