import type { Metadata } from 'next';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import { webPageJsonLd } from '../seo/schema';
import ColumnArchiveSearch from './ColumnArchiveSearch';
import ColumnCategoryNav from './ColumnCategoryNav';
import ColumnSourceNotice from './ColumnSourceNotice';
import { columnIndexMetadata, columnMedicalDisclaimer } from './column-content';
import { resolveColumnArchive, resolveColumnCategories } from './column-source';

/** 목록·상세·분류 화면이 같이 쓰는 브레드크럼. 첫 칸(홈)은 `MadiBreadcrumb`이 그린다. */
export const columnBreadcrumb = [
  { name: '커뮤니티', href: '/column' },
  { name: columnIndexMetadata.label, href: '/column' },
] as const;

export function columnIndexMetadataFor(
  state: Readonly<{ requestedPage: number; searchQuery: string }>,
): Metadata {
  const hasQueryState = Boolean(state.searchQuery) || state.requestedPage > 1;

  return {
    title: { absolute: columnIndexMetadata.title },
    description: columnIndexMetadata.description,
    alternates: {
      canonical: '/column',
      types: { 'application/rss+xml': '/column/rss.xml' },
    },
    // 검색·페이지 상태는 같은 글의 다른 조합이라 색인하지 않는다.
    robots: hasQueryState ? { index: false, follow: true } : undefined,
  };
}

/**
 * `/column` 목록 화면.
 *
 * headnerve `app/column/page.tsx`의 본문을 그대로 옮기고 틀만 `MadiPageFrame`
 * (헤더 → 서브 배너 → 브레드크럼 → main → 푸터)으로 바꿨다. headnerve의
 * `SiteHeader`·`SitePageHero`·`FinalCta`·`DiseaseClosing`은 쓰지 않는다(PLAN.md §2.2).
 */
export default async function ColumnArchive({
  requestedPage,
  searchQuery,
}: Readonly<{ requestedPage: number; searchQuery: string }>) {
  const [archive, categoryList] = await Promise.all([
    resolveColumnArchive(),
    resolveColumnCategories(),
  ]);

  return (
    <MadiPageFrame
      pathname="/column"
      title={columnIndexMetadata.label}
      banner="01"
      crumbs={columnBreadcrumb}
    >
      <JsonLd
        nodes={[
          webPageJsonLd({
            path: '/column',
            name: columnIndexMetadata.title,
            description: columnIndexMetadata.description,
            type: 'CollectionPage',
          }),
        ]}
      />
      <div className="cBox column-page clearFix">
        <h2 className="column-page__title">{columnIndexMetadata.label}</h2>
        <ColumnSourceNotice status={archive.status} />
        <div className="column-list">
          <div className="column-shell">
            <ColumnArchiveSearch
              entries={archive.entries}
              requestedPage={requestedPage}
              searchQuery={searchQuery}
              categoryNavigation={<ColumnCategoryNav categories={categoryList.categories} />}
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
