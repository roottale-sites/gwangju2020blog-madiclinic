import type { Metadata } from 'next';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import { webPageJsonLd } from '../seo/schema';
import ColumnArchiveSearch from './ColumnArchiveSearch';
import ColumnCategoryNav from './ColumnCategoryNav';
import { columnBreadcrumb } from './ColumnArchive';
import { columnIndexMetadata, columnMedicalDisclaimer } from './column-content';
import type { ColumnCategoryArchive } from './column-source';

/**
 * 분류 화면의 `<title>`·설명은 CMS 분류의 SEO 값을 쓴다. 분류가 SEO 값을 비워
 * 두면 분류 이름으로 조립한다 — 코드에 분류 문구를 두지 않는다(PLAN.md §4.2).
 */
export function columnCategoryMetadata(
  archive: ColumnCategoryArchive,
  state: Readonly<{ requestedPage: number; searchQuery: string }> = {
    requestedPage: 1,
    searchQuery: '',
  },
): Metadata {
  const isVariant = state.requestedPage > 1 || state.searchQuery.length > 0;
  const title = `${archive.category.seoTitle} | ${columnIndexMetadata.title}`;
  const description = archive.category.seoDescription || columnIndexMetadata.description;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: archive.category.path },
    robots: isVariant ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website',
      title,
      description,
      url: archive.category.path,
    },
  };
}

/** `/column/{category}` 목록. 본문은 headnerve와 같고 틀만 `MadiPageFrame`이다. */
export default function ColumnCategoryPage({
  archive,
  requestedPage,
  searchQuery,
}: Readonly<{
  archive: ColumnCategoryArchive;
  requestedPage: number;
  searchQuery: string;
}>) {
  const crumbs = [...columnBreadcrumb, { name: archive.category.name, href: archive.category.path }];

  return (
    <MadiPageFrame
      pathname={archive.category.path}
      title={columnIndexMetadata.label}
      banner="01"
      crumbs={crumbs}
    >
      <JsonLd
        nodes={[
          webPageJsonLd({
            path: archive.category.path,
            name: archive.category.seoTitle,
            description: archive.category.seoDescription || columnIndexMetadata.description,
            type: 'CollectionPage',
          }),
        ]}
      />
      <div className="cBox column-page clearFix">
        <h1 className="column-page__title">{archive.category.name}</h1>
        {archive.category.description ? (
          <p className="column-page__lead">{archive.category.description}</p>
        ) : null}
        <div className="column-list">
          <div className="column-shell">
            <ColumnArchiveSearch
              entries={archive.entries}
              requestedPage={requestedPage}
              searchQuery={searchQuery}
              basePath={archive.category.path}
              categoryNavigation={
                <ColumnCategoryNav
                  categories={archive.categories}
                  activeCategorySlug={archive.category.slug}
                />
              }
            />
            <aside className="column-disclaimer" aria-label="의료 콘텐츠 안내">
              <strong>의료 콘텐츠 안내</strong>
              <p>{columnMedicalDisclaimer}</p>
            </aside>
          </div>
        </div>
      </div>
    </MadiPageFrame>
  );
}
