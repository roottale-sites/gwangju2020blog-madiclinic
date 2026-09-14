import { expect, test } from '@playwright/test';

/**
 * 실 CMS 키가 없으면 발행 글이 없다. 여기서는 없는 글·없는 분류가 404로 끝나고
 * 미리보기 주소가 토큰 없이 열리지 않는 것만 본다. 상세 화면의 레일·목차는
 * 프로비저닝(9단계) 뒤 실데이터로 검증한다.
 */
test('없는 분류·없는 글은 404다', async ({ page }) => {
  for (const path of ['/column/없는-분류', '/column/없는-분류/없는-글']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});

test('미리보기 주소는 토큰 없이 열리지 않는다', async ({ page }) => {
  const response = await page.goto('/preview/post/0193-post');

  expect(response?.status()).toBe(404);
});

test('RSS와 사이트맵은 글이 없어도 유효한 XML을 준다', async ({ request }) => {
  const rss = await request.get('/column/rss.xml');
  expect(rss.status()).toBe(200);
  expect(rss.headers()['content-type']).toContain('application/rss+xml');
  expect(await rss.text()).toContain('<rss');

  const sitemap = await request.get('/column-sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(
    '<loc>https://gwangju2020blog.madiclinic.co.kr/column</loc>',
  );
});
