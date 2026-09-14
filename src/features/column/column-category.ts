/**
 * 칼럼 분류 경로·참조.
 *
 * headnerve는 `column-category-manifest.json`(88건 원장)이 분류의 단일 출처였다.
 * 이 저장소는 분류 값을 코드에 두지 않는다(PLAN.md §4.2) — 목록·SEO 문구는 CMS
 * 공개 분류 API(`/v1/cms/public/categories`)에서 읽고, 여기에는 주소 계산과
 * 글에 붙은 분류 term 읽기만 남는다.
 */
export type ColumnCategory = {
  slug: string;
  name: string;
  path: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  publishedPostCount: number;
};

export type ColumnCategoryRef = Pick<ColumnCategory, 'slug' | 'name' | 'path'>;

type ColumnTermRef = {
  taxonomy: string;
  slug: string;
  name: string;
};

export function columnCategoryPath(categorySlug: string): string {
  return `/column/${encodeURIComponent(categorySlug)}`;
}

export function nestedColumnEntryPath(categorySlug: string, articleSlug: string): string {
  return `${columnCategoryPath(categorySlug)}/${encodeURIComponent(articleSlug)}`;
}

/**
 * 글에 붙은 분류 하나를 읽는다.
 *
 * 콘텐츠 모델이 `categoryCardinality: exactly-one`이라 발행 글에는 분류가 정확히
 * 하나 붙는다. 그 계약이 깨진 응답(분류 0개 또는 2개 이상)은 주소를 만들 수
 * 없으므로 null이고, 호출부가 목록·사이트맵에서 그 글을 제외한다. headnerve처럼
 * 정적 원장으로 보완하지 않는다 — 코드에 분류가 없기 때문이다.
 */
export function columnCategoryRefFromTerms(
  terms: readonly ColumnTermRef[] | undefined,
): ColumnCategoryRef | null {
  const attachedCategories = (terms ?? []).filter((term) => term.taxonomy === 'category');
  if (attachedCategories.length !== 1) return null;

  const [category] = attachedCategories;
  if (!category) return null;
  return {
    slug: category.slug,
    name: category.name,
    path: columnCategoryPath(category.slug),
  };
}
