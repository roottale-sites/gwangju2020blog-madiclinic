import { expect, test, type Page } from '@playwright/test';

type JsonLdNode = Record<string, unknown>;

/**
 * headnerve `tests/seo-schema.spec.ts`를 이 저장소의 세 기능 기준으로 옮긴 것이다.
 *
 * 실 CMS 키 없이 도는 범위만 본다 — 전역 병원 엔티티와 목록·분류 화면의 페이지
 * 스키마·브레드크럼이다. 칼럼 상세의 `Article`과 FAQ 상세의 `FAQPage`는 발행 글이
 * 있어야 열리므로 단위 테스트(`ColumnDetailRoute`·`FaqPages.test.tsx`)가 덮고,
 * 실데이터 확인은 ROOT-ADMIN 프로비저닝(9단계)에서 한다.
 */
async function structuredDataNodes(page: Page): Promise<JsonLdNode[]> {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.flatMap((script) => {
      const parsed = JSON.parse(script.textContent ?? '{}') as { '@graph'?: JsonLdNode[] };
      return parsed['@graph'] ?? [];
    }),
  );
}

function nodeTypes(nodes: readonly JsonLdNode[]): string[] {
  return nodes.flatMap((node) => {
    const type = node['@type'];
    return typeof type === 'string'
      ? [type]
      : Array.isArray(type)
        ? type.filter((value): value is string => typeof value === 'string')
        : [];
  });
}

test('세 기능 목록 모두 병원 엔티티·페이지·브레드크럼 스키마를 함께 제공한다', async ({ page }) => {
  for (const path of ['/column', '/reviews', '/faq']) {
    await page.goto(path);
    expect(nodeTypes(await structuredDataNodes(page))).toEqual(expect.arrayContaining([
      'WebSite', 'MedicalClinic', 'Physician', 'CollectionPage', 'BreadcrumbList',
    ]));
  }
});

test('병원 엔티티는 세 기능에서 같은 주체 하나를 가리킨다', async ({ page }) => {
  await page.goto('/faq');
  const nodes = await structuredDataNodes(page);

  const clinic = nodes.find((node) => node['@type'] === 'MedicalClinic');
  expect(clinic?.name).toBe('광주 남구 마디클리닉');
  // 병원 자체의 url은 본 사이트다. 이 배포는 블로그 서브도메인이다.
  expect(clinic?.url).toBe('http://gwangju2020.madiclinic.co.kr/');
  expect(clinic?.['@id']).toBe('https://gwangju2020blog.madiclinic.co.kr/#medical-clinic');

  const physician = nodes.find((node) => node['@type'] === 'Physician');
  expect(physician?.name).toBe('이경무');
  expect(physician?.worksFor).toEqual({ '@id': clinic?.['@id'] });
});

test('브레드크럼 스키마는 화면 브레드크럼과 같은 경로를 쓴다', async ({ page }) => {
  await page.goto('/faq');

  const nodes = await structuredDataNodes(page);
  const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList');
  const items = (breadcrumb?.itemListElement ?? []) as Array<{ name: string; item: string }>;
  expect(items.map((item) => item.name)).toEqual(['커뮤니티', '자주 묻는 질문']);
  expect(items.at(-1)?.item).toBe('https://gwangju2020blog.madiclinic.co.kr/faq');

  const visible = await page.locator('.whereIsLine ul.whereIs > li:nth-child(n+2)').allInnerTexts();
  expect(visible.map((text) => text.trim())).toEqual(items.map((item) => item.name));
});
