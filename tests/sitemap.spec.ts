import { expect, test } from '@playwright/test';

/**
 * headnerve `tests/sitemap.spec.ts`를 자식 4개·새 호스트 기준으로 옮긴 것이다.
 * `public/sitemap.xsl`이 XML을 사람이 읽는 표로 그린다.
 */
test('사이트맵 인덱스는 자식 4개를 브라우저용 표로 보여준다', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.status()).toBe(200);

  await expect(page.getByRole('heading', { name: 'XML Sitemap Index' })).toBeVisible();
  await expect(page.getByText('Total Sitemaps: 4')).toBeVisible();
  for (const child of ['sitemap-static.xml', 'reviews-sitemap.xml', 'column-sitemap.xml', 'faq-sitemap.xml']) {
    await expect(page.getByRole('link', { name: new RegExp(child.replace('.', '\\.')) })).toBeVisible();
  }
});

test('정적 사이트맵은 세 기능의 목록 주소와 마지막 수정일을 보여준다', async ({ page }) => {
  await page.goto('/sitemap-static.xml');

  await expect(page.getByRole('heading', { name: 'XML Sitemap' })).toBeVisible();
  for (const path of ['/column', '/reviews', '/faq']) {
    await expect(page.getByRole('link', {
      name: `https://gwangju2020blog.madiclinic.co.kr${path}`,
      exact: true,
    })).toBeVisible();
  }
  await expect(page.locator('tbody tr').first().locator('td').nth(1)).not.toBeEmpty();
});

test('robots.txt는 이 인덱스 하나만 가리키고 미리보기를 막는다', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain('Sitemap: https://gwangju2020blog.madiclinic.co.kr/sitemap.xml');
  expect(body).toContain('Disallow: /preview/');
});
