import { loadColumnArchive, loadColumnCategories, loadColumnPost } from './column-api';
import { columnCategoryPath, type ColumnCategory } from './column-category';
import {
  columnArchiveEntryFromPost,
  columnEntryFromPost,
  sortColumnEntries,
  type ColumnArchiveEntry,
  type ColumnEntry,
} from './column-model';

/**
 * 출처 경계.
 *
 * CMS 응답이 **성공**이면 그 결과가 곧 진실이다. 목록이 비어 있어도 비어 있는
 * 것이고, 상세가 null이면 없는 글이다. ROOT-ADMIN에서 글을 내리거나 지운 것이
 * 사이트에 그대로 반영되어야 한다.
 *
 * headnerve는 비밀값 미설정·CMS 장애일 때 이관 JSON 88건으로 되돌아갔다. 이
 * 저장소에는 폴백 콘텐츠가 없으므로(PLAN.md §5.3) 같은 두 경우를 `status`로
 * 알리고 화면이 안내 문구를 띄운다. 상세는 404다.
 */
export type ColumnSourceStatus = 'ok' | 'unconfigured' | 'upstream';

export type ColumnArchive = {
  entries: readonly ColumnArchiveEntry[];
  status: ColumnSourceStatus;
};

export type ColumnCategoryList = {
  categories: readonly ColumnCategory[];
  status: ColumnSourceStatus;
};

export async function resolveColumnArchive(): Promise<ColumnArchive> {
  const result = await loadColumnArchive();
  if (!result.ok) return { entries: [], status: result.reason };

  // 분류가 정확히 하나가 아닌 글은 공개 주소를 만들 수 없어 목록에서 뺀다.
  const entries = result.data.flatMap((post) => {
    const entry = columnArchiveEntryFromPost(post);
    return entry ? [entry] : [];
  });
  return { entries: sortColumnEntries(entries), status: 'ok' };
}

export async function resolveColumnEntry(slug: string): Promise<ColumnEntry | null> {
  const result = await loadColumnPost(slug);
  // 성공 응답은 비어 있어도 권위가 있다. null이면 없는 글이다.
  if (!result.ok || !result.data) return null;
  return columnEntryFromPost(result.data);
}

export async function resolveColumnCategories(): Promise<ColumnCategoryList> {
  const result = await loadColumnCategories();
  if (!result.ok) return { categories: [], status: result.reason };

  return {
    categories: result.data.map((category) => ({
      slug: category.slug,
      name: category.name,
      path: category.path ?? columnCategoryPath(category.slug),
      description: category.description ?? '',
      seoTitle: category.seoTitle ?? category.name,
      seoDescription: category.seoDescription ?? category.description ?? '',
      publishedPostCount: category.publishedPostCount,
    })),
    status: 'ok',
  };
}

export type ColumnCategoryArchive = {
  category: ColumnCategory;
  categories: readonly ColumnCategory[];
  entries: readonly ColumnArchiveEntry[];
};

/**
 * 분류 목록 화면. 분류가 없거나 CMS를 읽을 수 없으면 null이고 라우트가 상세
 * 경로로 넘긴다(그쪽도 없으면 404).
 */
export async function resolveColumnCategoryArchive(
  categorySlug: string,
): Promise<ColumnCategoryArchive | null> {
  const [categoryList, archive] = await Promise.all([
    resolveColumnCategories(),
    resolveColumnArchive(),
  ]);
  const category = categoryList.categories.find((entry) => entry.slug === categorySlug);
  if (!category) return null;
  return {
    category,
    categories: categoryList.categories,
    entries: archive.entries.filter((entry) => entry.category.slug === categorySlug),
  };
}
