import { expect, test } from '@playwright/test';

/**
 * 실 CMS 키 없이 도는 범위만 본다 — 마디 골격, 준비 중 안내, 라우트 경계다.
 * 진료 영역 카드·질문 목록·상세는 ROOT-ADMIN 프로비저닝(9단계) 뒤 실데이터로
 * 덮는다. 키가 없으면 분류를 읽을 수 없어 하위 단계는 404가 아니라 상태 안내다
 * (나중에 살아날 주소를 없다고 알리지 않는다).
 */
const frameSelectors = ['#header', '#bnSubArea .subVisualArea', '.whereIsLine', 'main#main', '#bottom'] as const;

test('자주 묻는 질문 홈은 마디 골격 안에서 준비 중 상태를 안내한다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/faq');

  for (const selector of frameSelectors) {
    await expect(page.locator(selector)).toHaveCount(1);
  }
  await expect(page.locator('#bnSubArea .sbn h2')).toHaveText('자주 묻는 질문');
  await expect(page.getByRole('heading', { level: 2, name: '자주 묻는 질문' }).first()).toBeVisible();
  // 키가 없으면 빈 화면이 아니라 이유를 밝힌다.
  await expect(page.locator('.faq-notice')).toBeVisible();
  await expect(page.locator('.faq-section-card')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://gwangju2020blog.madiclinic.co.kr/faq',
  );
  // 헤더 로고만 h1이다(1px 재현 계약). 본문 제목은 h2다.
  expect(await page.locator('h1').count()).toBe(2);
  await expect(page.locator('main#main h1')).toHaveCount(0);
});

test('자주 묻는 질문 홈은 390px에서도 가로 스크롤 없이 한 열로 읽힌다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/faq');

  await expect(page.locator('#bnSubArea .sbn h2')).toHaveText('자주 묻는 질문');
  await expect(page.locator('.faq-notice')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('CMS를 읽지 못하는 하위 단계는 골격 안 상태 안내이고 사이트맵은 503이다', async ({ page, request }) => {
  for (const path of ['/faq/spine', '/faq/spine/neck-pain', '/faq/spine/neck-pain/mri-normal']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('#bnSubArea .subVisualArea.sbnNo03')).toHaveCount(1);
    await expect(page.locator('.faq-state h2')).toHaveText('자주 묻는 질문을 불러오지 못했습니다');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  }

  // 빈 사이트맵을 하루 캐시하면 색인된 주소가 사라진다.
  const sitemap = await request.get('/faq-sitemap.xml');
  expect(sitemap.status()).toBe(503);
  expect(sitemap.headers()['retry-after']).toBe('300');
});

test('네 단계를 넘는 주소는 라우트가 없어 404다', async ({ page }) => {
  const response = await page.goto('/faq/spine/neck-pain/mri-normal/extra');
  expect(response?.status()).toBe(404);
});
