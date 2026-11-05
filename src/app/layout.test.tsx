import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { headers } from 'next/headers';
import JsonLd from '../components/site/JsonLd';
import { contentEntityJsonLd, webPageJsonLd } from '../features/seo/schema';
import { loadSiteContent } from '../features/site-content/source';
import RootLayout from './layout';

vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('../features/site-content/source', () => ({ loadSiteContent: vi.fn() }));
vi.mock('../components/site/SiteLayout', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../features/analytics/RootAnalytics', () => ({ RootAnalytics: () => null }));

beforeEach(() => {
  vi.mocked(headers).mockResolvedValue(new Headers());
  vi.mocked(loadSiteContent).mockReset().mockResolvedValue({ documents: [] });
});

test('공통 구조화 데이터는 head에서 한 번만 내고 페이지 노드는 본문에 둔다', async () => {
  const page = webPageJsonLd({ path: '/column', name: '칼럼', description: '칼럼 목록' });
  const html = renderToStaticMarkup(await RootLayout({ children: <JsonLd nodes={[page]} /> }));
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
  const scripts = (markup: string) => [...markup.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )].map((match) => JSON.parse(match[1]!));

  expect(scripts(head)).toEqual([{
    '@context': 'https://schema.org', '@graph': contentEntityJsonLd(),
  }]);
  expect(scripts(body)).toEqual([{
    '@context': 'https://schema.org', '@graph': [page],
  }]);
  expect(scripts(html)).toHaveLength(2);
});

test('미리보기는 공통 구조화 데이터와 공통 콘텐츠 조회를 생략한다', async () => {
  vi.mocked(headers).mockResolvedValue(new Headers({ 'x-madi-preview': '1' }));
  const html = renderToStaticMarkup(await RootLayout({ children: <main>미리보기</main> }));
  expect(html).toContain('<main>미리보기</main>');
  expect(html).not.toContain('application/ld+json');
  expect(loadSiteContent).not.toHaveBeenCalled();
});
