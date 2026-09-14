import type { Metadata } from 'next';

import '../../../styles/site/column.css';
import '../../../styles/site/post-pattern.css';
import ColumnCategoryPage, {
  columnCategoryMetadata,
} from '../../../features/column/ColumnCategoryPage';
import ColumnDetailRoute, {
  columnDetailMetadata,
} from '../../../features/column/ColumnDetailRoute';
import { parseColumnPageNumber } from '../../../features/column/column-pagination';
import { resolveColumnCategoryArchive } from '../../../features/column/column-source';

type ColumnCategoryRouteProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = 'force-dynamic';

function decodeCategory(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0]?.trim() ?? '' : value?.trim() ?? '';
}

/**
 * 한 세그먼트는 분류일 수도, (분류 없이 열린) 글 주소일 수도 있다. 분류로 먼저
 * 찾고 없으면 상세로 넘긴다 — 그쪽도 없으면 404다. headnerve와 같은 순서다.
 */
export async function generateMetadata({
  params,
  searchParams,
}: ColumnCategoryRouteProps): Promise<Metadata> {
  const category = decodeCategory((await params).category);
  const categoryArchive = await resolveColumnCategoryArchive(category);
  if (!categoryArchive) return columnDetailMetadata(category);

  const query = await searchParams;
  return columnCategoryMetadata(categoryArchive, {
    requestedPage: parseColumnPageNumber(firstValue(query.page) || null),
    searchQuery: firstValue(query.q),
  });
}

export default async function ColumnCategoryRoute({
  params,
  searchParams,
}: ColumnCategoryRouteProps) {
  const category = decodeCategory((await params).category);
  const categoryArchive = await resolveColumnCategoryArchive(category);
  if (!categoryArchive) return <ColumnDetailRoute slug={category} />;

  const query = await searchParams;
  return (
    <ColumnCategoryPage
      archive={categoryArchive}
      requestedPage={parseColumnPageNumber(firstValue(query.page) || null)}
      searchQuery={firstValue(query.q)}
    />
  );
}
