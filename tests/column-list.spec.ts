import { expect, test } from '@playwright/test';

/**
 * 실 CMS 키 없이 도는 범위만 본다 — 헤더·메뉴·브레드크럼·푸터 골격과
 * 빈 상태 안내다. 글 수·페이지네이션·카드 배치는 ROOT-ADMIN 프로비저닝(9단계)
 * 뒤에 실데이터로 덮는다.
 */
const frameSelectors = ['#header', '.madi-page-frame', '.whereIsLine', 'main#main', '#bottom'] as const;

test('블로그 목록은 마디 골격 안에서 빈 상태를 안내한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/column');

  for (const selector of frameSelectors) {
    await expect(page.locator(selector)).toHaveCount(1);
  }
  await expect(page.locator('main#main')).toHaveAttribute('aria-label', '블로그');
  // 본문의 접근성 이름을 유지한다.
  await expect(page.locator('main#main').getByRole('heading', { level: 2, name: '블로그', exact: true })).toHaveCount(0);
  await expect(page.locator('main#main h1')).toHaveCount(0);
  // 키가 없으면 빈 목록이 아니라 이유를 밝힌다.
  await expect(page.locator('.column-notice')).toBeVisible();
  await expect(page.locator('.column-empty')).toHaveCount(0);
  await expect(page.locator('.column-notice')).toHaveCount(1);
  await expect(page.locator('.column-card')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://gwangju2020blog.madiclinic.co.kr/column',
  );
  await expect(page.locator('.column-disclaimer p')).toContainText('정보 제공용');
});

test('블로그 목록은 390px에서도 가로 스크롤 없이 한 열로 읽힌다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/column');

  await expect(page.locator('main#main')).toHaveAttribute('aria-label', '블로그');
  await expect(page.locator('.column-notice')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('.column-search summary').click();
  const panel = await page.locator('.column-search__panel').boundingBox();
  expect(panel).not.toBeNull();
  expect(panel!.x).toBeGreaterThanOrEqual(20);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(370);
  await expect(page.locator('#column-search-query')).toBeVisible();
});

test('검색 폼은 GET 주소로 목록 상태를 고정한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/column?q=%EB%AC%B4%EB%A6%8E');

  await expect(page.locator('#column-search-query')).toHaveValue('무릎');
  // 검색·페이지 상태는 같은 글의 다른 조합이라 색인하지 않는다.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
