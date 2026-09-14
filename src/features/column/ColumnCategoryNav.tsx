import Link from 'next/link';

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

  return (
    <nav className="column-category-nav" aria-label="블로그 분류">
      <ul>
        <li>
          <Link
            href="/column"
            scroll={false}
            aria-current={activeCategorySlug ? undefined : 'page'}
            aria-label={`전체 ${totalPostCount}건`}
          >
            전체
            <span aria-hidden="true">{totalPostCount}</span>
          </Link>
        </li>
        {visibleCategories.map((category) => (
          <li key={category.slug}>
            <Link
              href={category.path}
              scroll={false}
              aria-current={activeCategorySlug === category.slug ? 'page' : undefined}
              aria-label={`${category.name} ${category.publishedPostCount}건`}
            >
              {category.name}
              <span aria-hidden="true">{category.publishedPostCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
