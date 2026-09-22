import Link from 'next/link';
import type { ReactNode } from 'react';

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
 * 빈 목록 버튼은 `.column-empty__link`(헤더 버튼 문법)를 쓴다.
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
            <p aria-label={searchQuery ? `검색 결과 ${columnPage.total}건` : `총 ${columnPage.total}건`}>
              {searchQuery ? `검색 결과 ${columnPage.total}건` : `총 ${columnPage.total}건`}
            </p>
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
          <Link className="column-empty__link" href={basePath}>전체 글 보기</Link>
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
      {columnPage.pageCount > 1 && (
        <nav className="column-pagination" aria-label="블로그 페이지">
          <div className="column-pagination__direction">
            {columnPage.page > 1 && (
              <Link href={columnArchiveUrl(columnPage.page - 1, searchQuery, basePath)} rel="prev">← 이전</Link>
            )}
          </div>
          <ol className="column-pagination__pages">
            {Array.from({ length: columnPage.pageCount }, (_, index) => index + 1).map((page) => (
              <li key={page}>
                <Link
                  href={columnArchiveUrl(page, searchQuery, basePath)}
                  aria-current={page === columnPage.page ? 'page' : undefined}
                  aria-label={`${page}페이지`}
                >
                  {page}
                </Link>
              </li>
            ))}
          </ol>
          <div className="column-pagination__direction column-pagination__direction--next">
            {columnPage.page < columnPage.pageCount && (
              <Link href={columnArchiveUrl(columnPage.page + 1, searchQuery, basePath)} rel="next">다음 →</Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
