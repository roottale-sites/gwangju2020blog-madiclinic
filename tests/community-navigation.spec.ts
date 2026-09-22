import { expect, test } from '@playwright/test';

test('커뮤니티 메뉴는 문서와 헤더를 유지하며 이동하고 뒤로 갈 수 있다', async ({ page }) => {
  await page.goto('/column');
  await expect(page.locator('#header .headerFix')).toHaveClass(/slideDown/);
  const header = await page.locator('#header').elementHandle();
  const documents: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.resourceType() === 'document') documents.push(request.url());
  });

  await page.locator('#subHeader a[href="/faq"]').click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.locator('main#main')).toHaveAttribute('aria-label', '자주 묻는 질문');
  expect(documents).toEqual([]);
  expect(await page.evaluate((node) => node === document.querySelector('#header'), header)).toBe(true);

  await page.locator('#gnb > li:last-child > a').hover();
  await page.locator('#gnb .subMenu a[href="/reviews"]').click();
  await expect(page).toHaveURL(/\/reviews$/);
  await expect(page.locator('#gnb .subMenu a[href="/reviews"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#gnb > li:last-child .subMenu')).toBeHidden();

  await page.locator('.breadcrumbToggle').nth(1).click();
  await page.locator('.depthMenu a[href="/column"]:visible').click();
  await expect(page).toHaveURL(/\/column$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/reviews$/);
  expect(documents).toEqual([]);
  expect(await page.evaluate((node) => node === document.querySelector('#header'), header)).toBe(true);
  await page.locator('#subHeader a[href="/column"]').click();
  await page.locator('.column-search summary').click();
  await page.locator('#column-search-query').fill('무릎');
  await page.getByRole('button', { name: '검색', exact: true }).click();
  await expect(page).toHaveURL(/\/column\?q=/);
  expect(documents).toEqual([]);
  expect(await page.evaluate((node) => node === document.querySelector('#header'), header)).toBe(true);
  await expect(page.locator('#gnb > li:first-child > a')).toHaveAttribute('href', 'http://gwangju2020.madiclinic.co.kr/doctor/doctor01.html');
});

test('모바일 메뉴 이동 후 드로어와 스크롤 잠금이 풀린다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/column');
  await expect(page.locator('#header .headerFix')).toHaveClass(/slideDown/);
  const documents: string[] = [];
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.resourceType() === 'document') documents.push(request.url());
  });
  await page.locator('#naviToggle').click();
  await page.locator('#gnb > li:last-child > a').click();
  await page.locator('#gnb .subMenu a[href="/faq"]').click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.locator('#gnb')).toBeHidden();
  await expect(page.locator('#header .topLink')).toBeHidden();
  await expect(page.locator('#header .officialWeb')).toBeHidden();
  await expect(page.locator('#naviToggle')).toHaveAttribute('title', '전체메뉴 열기');
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  expect(documents).toEqual([]);
});
