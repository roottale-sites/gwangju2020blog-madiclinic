import { expect, test } from '@playwright/test';

/**
 * Playwright 서버는 CMS 키를 비워 둔다. 헤더·서브 배너·브레드크럼·푸터와
 * 데이터 연결 안내, 검색 도구의 기본 동작을 확인한다.
 */
const frameSelectors = ['#header', '#bnSubArea .subVisualArea', '.whereIsLine', 'main#main', '#bottom'] as const;

test('블로그 목록은 마디 골격 안에서 데이터 연결 상태를 안내한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/column');

  for (const selector of frameSelectors) {
    await expect(page.locator(selector)).toHaveCount(1);
  }
  await expect(page.locator('#bnSubArea .sbn h2')).toHaveText('블로그');
  // 배너의 메뉴 이름을 본문에서 반복하지 않는다.
  await expect(page.locator('main#main').getByRole('heading', { level: 2, name: '블로그', exact: true })).toHaveCount(0);
  await expect(page.locator('main#main h1')).toHaveCount(0);
  // 키가 없으면 빈 목록이 아니라 이유를 밝힌다.
  await expect(page.locator('.column-notice')).toContainText('블로그 준비 중입니다');
  await expect(page.locator('.column-empty')).toHaveCount(0);
  await expect(page.locator('.column-notice')).toHaveCount(1);
  await expect(page.locator('.column-card')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://gwangju2020blog.madiclinic.co.kr/column',
  );
});

test('블로그 목록은 390px에서도 가로 스크롤 없이 한 열로 읽힌다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/column');

  await expect(page.locator('#bnSubArea .sbn h2')).toHaveText('블로그');
  await expect(page.locator('.column-notice')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: '블로그 검색 열기' }).click();
  const panel = await page.locator('.archive-search__panel').boundingBox();
  expect(panel).not.toBeNull();
  expect(panel!.x).toBeGreaterThanOrEqual(20);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(370);
  await expect(page.getByRole('searchbox', { name: '블로그 검색' })).toBeVisible();
});

test('검색 폼은 GET 주소로 목록 상태를 고정한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/column?q=%EB%AC%B4%EB%A6%8E');

  await expect(page.getByRole('searchbox', { name: '블로그 검색' })).toHaveValue('무릎');
  // 검색·페이지 상태는 같은 글의 다른 조합이라 색인하지 않는다.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
