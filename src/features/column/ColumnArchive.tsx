import type { Metadata } from 'next';
import ArchiveNotice from '../../components/site/ArchiveNotice';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import { webPageJsonLd } from '../seo/schema';
import { loadArchiveSeo } from '../seo/archive-seo';
import { pageSeoMetadata, type PageSeo } from '../seo/cms-metadata';
import { DEFAULT_OG_IMAGE_URL } from '../seo/og-image';
import ColumnArchiveSearch from './ColumnArchiveSearch';
import ColumnCategoryNav from './ColumnCategoryNav';
import { columnIndexMetadata, columnMedicalDisclaimer } from './column-content';
import { resolveColumnArchive, resolveColumnCategories } from './column-source';

/** 목록·상세·분류 화면이 같이 쓰는 브레드크럼. 첫 칸(홈)은 `MadiBreadcrumb`이 그린다. */
export const columnBreadcrumb = [
  { name: '커뮤니티', href: '/column' },
  { name: columnIndexMetadata.label, href: '/column' },
] as const;

export function columnIndexMetadataFor(
  state: Readonly<{ requestedPage: number; searchQuery: string }>,
  seo: PageSeo = { ...columnIndexMetadata, imageUrl: DEFAULT_OG_IMAGE_URL },
): Metadata {
  return {
    ...pageSeoMetadata('/column', { ...seo, noindex: seo.noindex || Boolean(state.searchQuery) }),
    alternates: {
      canonical: '/column',
      types: { 'application/rss+xml': '/column/rss.xml' },
    },
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
  const [archive, categoryList, seo] = await Promise.all([
    resolveColumnArchive(),
    resolveColumnCategories(),
    loadArchiveSeo('column'),
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
            name: seo.title,
            description: seo.description,
            type: 'CollectionPage',
          }),
        ]}
      />
      <div className="cBox column-page clearFix">
        <div className="column-list">
          <div className="column-shell">
            <ColumnArchiveSearch
              entries={archive.entries}
              sourceStatus={archive.status}
              requestedPage={requestedPage}
              searchQuery={searchQuery}
              categoryNavigation={<ColumnCategoryNav categories={categoryList.categories} />}
            />
            <ArchiveNotice title="의료 콘텐츠 안내">{columnMedicalDisclaimer}</ArchiveNotice>
          </div>
        </div>
      </div>
    </MadiPageFrame>
  );
}
