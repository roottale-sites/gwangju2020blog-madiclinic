import Link from 'next/link';
import type { ReactNode } from 'react';

import ArchivePagination from '../../components/site/ArchivePagination';
import ColumnArchiveRow from './ColumnArchiveRow';
import ColumnSearchField from './ColumnSearchField';
import ColumnSourceNotice from './ColumnSourceNotice';
import type { ColumnSourceStatus } from './column-source';
import type { ColumnArchiveEntry } from './column-model';
import { columnArchiveUrl, paginateColumnEntries } from './column-pagination';
import { searchColumnArchiveEntries } from './column-search';

type ColumnArchiveSearchProps = {
  entries: readonly ColumnArchiveEntry[];
  searchQuery: string;
  requestedPage: number;
  basePath?: string;
  sourceStatus?: ColumnSourceStatus;
  categoryNavigation: ReactNode;
};

/**
 * URL의 검색어·페이지를 기준으로 렌더하는 블로그 목록.
 * 검색 결과와 페이지를 공유하거나 다시 열어도 같은 목록 상태를 복원한다.
 *
 * 페이지 제목과 목록 도구를 분리하고, CMS 상태에 따라 안내를 한 번만 표시한다.
 * 검색 결과 유무와 관계없이 도구 줄에서 검색을 해제할 수 있다.
 */
export default function ColumnArchiveSearch({
  entries,
  searchQuery,
  requestedPage,
  basePath = '/column',
  sourceStatus = 'ok',
  categoryNavigation,
}: ColumnArchiveSearchProps) {
  const filteredEntries = searchColumnArchiveEntries(entries, searchQuery);
  const columnPage = paginateColumnEntries(filteredEntries, requestedPage);

  return (
    <>
      <div className="column-list__bar">
        <h2 id="column-list-title" className="community-sr-only">블로그 목록</h2>
        <div className="column-list__tools">
          <ColumnSearchField key={`${basePath}:${searchQuery}`} basePath={basePath} searchQuery={searchQuery} />
          {sourceStatus === 'ok' && (
            <div className="column-list__result">
              <p aria-label={searchQuery ? `검색 결과 ${columnPage.total}건` : `총 ${columnPage.total}건`}>
                {searchQuery ? `검색 결과 ${columnPage.total}건` : `총 ${columnPage.total}건`}
              </p>
              {searchQuery && (
                <Link className="column-search__reset" href={columnArchiveUrl(1, '', basePath)} scroll={false}>
                  전체 글 보기 <span aria-hidden="true">↺</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      {sourceStatus === 'ok' && categoryNavigation}
      {sourceStatus !== 'ok' ? (
        <ColumnSourceNotice status={sourceStatus} />
      ) : columnPage.items.length === 0 && searchQuery ? (
        <div className="column-empty">
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어로 제목과 요약을 다시 찾아보세요.</p>
        </div>
      ) : columnPage.items.length === 0 ? (
        <div className="column-empty">
          <h3>새로운 글을 준비하고 있습니다</h3>
          <p>통증의 원인과 치료를 다룬 원장의 글로 곧 찾아뵙겠습니다.</p>
        </div>
      ) : (
        <ul className="column-list__items">
          {columnPage.items.map((entry) => <ColumnArchiveRow entry={entry} key={entry.slug} />)}
        </ul>
      )}
      {sourceStatus === 'ok' && columnPage.total > 0 && (
        <ArchivePagination
          label="블로그 페이지"
          page={columnPage.page}
          pageCount={columnPage.pageCount}
          hrefForPage={(page) => columnArchiveUrl(page, searchQuery, basePath)}
        />
      )}
    </>
  );
}
