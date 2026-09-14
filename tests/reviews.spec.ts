import { expect, test } from '@playwright/test';

/**
 * 목 CMS 없이 도는 범위만 본다 — 마디 골격, 키 미설정 안내, 없는 후기 404,
 * 피드·사이트맵 응답이다. 카드 배치·상세 레일은 ROOT-ADMIN 프로비저닝(9단계)
 * 뒤 실데이터로 덮는다.
 */
const frameSelectors = ['#header', '#bnSubArea .subVisualArea', '.whereIsLine', 'main#main', '#bottom'] as const;

test('후기 목록은 마디 골격 안에서 준비 중 상태를 안내한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/reviews');

  for (const selector of frameSelectors) {
    await expect(page.locator(selector)).toHaveCount(1);
  }
  await expect(page.locator('#bnSubArea .sbn h2')).toHaveText('후기');
  await expect(page.getByRole('heading', { level: 1, name: '후기' })).toBeVisible();
  await expect(page.locator('.reviews-state')).toBeVisible();
  await expect(page.locator('.review-card')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://gwangju2020blog.madiclinic.co.kr/reviews',
  );
});

test('후기 목록은 390px에서도 가로 스크롤 없이 읽힌다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/reviews');

  await expect(page.locator('#bnSubArea .sbn h2')).toHaveText('후기');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('CMS를 읽지 못하는 상세·피드는 빈 화면이 아니라 상태를 알린다', async ({ page, request }) => {
  // 키가 없으면 "없는 글"이 아니라 "지금 읽을 수 없음"이다. 404로 끊으면 나중에
  // 키가 생겼을 때 살아날 주소를 크롤러에 없다고 알리게 된다(headnerve와 같은 판정).
  const response = await page.goto('/reviews/없는-후기');
  expect(response?.status()).toBe(200);
  await expect(page.locator('.reviews-state--page h1')).toHaveText('후기를 불러오지 못했습니다');

  // CMS를 읽지 못하면 빈 피드를 캐시하지 않고 503 + retry-after로 답한다.
  for (const path of ['/reviews/rss.xml', '/reviews-sitemap.xml']) {
    const response = await request.get(path);
    expect(response.status()).toBe(503);
    expect(response.headers()['retry-after']).toBe('300');
  }
});
