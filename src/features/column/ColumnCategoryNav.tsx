import ArchiveTabs from '../../components/site/ArchiveTabs';

import type { ColumnCategory } from './column-category';

/**
 * 분류 칩 목록. headnerve 그대로이며 분류 값은 CMS에서 온다(PLAN.md §4.2).
 * 글이 0건인 분류는 빈 목록으로 보내지 않기 위해 숨긴다.
 */
type ColumnCategoryNavProps = {
  categories: readonly ColumnCategory[];
  activeCategorySlug?: string;
};

export default function ColumnCategoryNav({
  categories,
  activeCategorySlug,
}: ColumnCategoryNavProps) {
  const visibleCategories = categories.filter((category) => category.publishedPostCount > 0);
  if (visibleCategories.length === 0) return null;

  const totalPostCount = visibleCategories.reduce(
    (total, category) => total + category.publishedPostCount,
    0,
  );

  return <ArchiveTabs label="블로그 분류"
    activeHref={visibleCategories.find((category) => category.slug === activeCategorySlug)?.path ?? '/column'}
    items={[
      { name: '전체', href: '/column', count: totalPostCount },
      ...visibleCategories.map((category) => ({ name: category.name, href: category.path, count: category.publishedPostCount })),
    ]}
  />;
}
