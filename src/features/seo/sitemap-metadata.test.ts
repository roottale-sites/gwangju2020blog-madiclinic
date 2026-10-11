import { expect, test } from 'vitest';
import { filterSitemapUrls, mergeSitemapMetadata } from './sitemap-metadata';

const url = (path: string) => ({ loc: new URL(path, 'https://site.test').href });

test('색인 제외와 한글 경로의 활성 주소 이동을 빼고 해당 하위 글은 유지한다', () => {
  const context = mergeSitemapMetadata({ metadata: new Map(), redirects: [
    { id: 'redirect', fromPath: '/이전-주소/', toTarget: '/new', statusCode: 301 },
  ] }, [['/분류', { noindex: true }], ['/분류/공개-글', { noindex: false }], ['/비공개-글', { noindex: true }]]);
  const entries = ['/분류', '/분류/공개-글', '/비공개-글', '/이전-주소', '/new'].map(url);
  expect(filterSitemapUrls(entries, context)).toEqual(['/분류/공개-글', '/new'].map(url));
});

test('수동 설정을 초기화한 경로와 미확인 경로는 기존 사이트맵에 남긴다', () => {
  const context = mergeSitemapMetadata(undefined, [['/reset', {}], ['/nofollow', { nofollow: true }]]);
  const entries = ['/reset', '/nofollow', '/unchanged'].map(url);
  expect(filterSitemapUrls(entries, context)).toEqual(entries);
});
