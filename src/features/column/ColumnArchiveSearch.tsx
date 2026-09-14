import type { ReactNode } from 'react';

import ColumnArchiveRow from './ColumnArchiveRow';
import type { ColumnArchiveEntry } from './column-model';
import { columnArchiveUrl, paginateColumnEntries } from './column-pagination';
import { searchColumnArchiveEntries } from './column-search';

type ColumnArchiveSearchProps = {
  entries: readonly ColumnArchiveEntry[];
  searchQuery: string;
  requestedPage: number;
  basePath?: string;
  categoryNavigation: ReactNode;
};

/**
 * URL의 검색어·페이지를 기준으로 렌더하는 블로그 목록.
 * 검색 결과와 페이지를 공유하거나 다시 열어도 같은 목록 상태를 복원한다.
 *
 * headnerve `ColumnArchiveSearch` 그대로다. 라벨만 이 사이트의 "블로그"로 바꿨고
 * 빈 목록 버튼은 `ds/` 대신 `.column-empty__link`(헤더 버튼 문법)를 쓴다.
 */
export default function ColumnArchiveSearch({
  entries,
  searchQuery,
  requestedPage,
  basePath = '/column',
  categoryNavigation,
}: ColumnArchiveSearchProps) {
  const filteredEntries = searchColumnArchiveEntries(entries, searchQuery);
  const columnPage = paginateColumnEntries(filteredEntries, requestedPage);

  return (
    <>
      <div className="column-list__bar">
        <h2 id="column-list-title">블로그 목록</h2>
        <div className="column-list__tools">
          <details className="column-search" open={Boolean(searchQuery)}>
            <summary aria-label="블로그 검색 열기">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="10.8" cy="10.8" r="6.3" />
                <path d="m16 16 4.2 4.2" />
              </svg>
            </summary>
            <form className="column-search__panel" action={basePath} role="search" aria-label="블로그 검색">
              <label htmlFor="column-search-query">블로그 검색</label>
              <div className="column-search__control">
                <input
                  id="column-search-query"
                  name="q"
                  type="search"
                  defaultValue={searchQuery}
                  placeholder="제목 또는 요약 검색"
                />
                <button type="submit">검색</button>
              </div>
            </form>
          </details>
          <p aria-label={searchQuery ? `검색 결과 ${columnPage.total}건` : `총 ${columnPage.total}건`}>
            {searchQuery ? `검색 결과 ${columnPage.total}건` : `총 ${columnPage.total}건`}
          </p>
        </div>
      </div>
      {categoryNavigation}
      {columnPage.items.length === 0 && searchQuery ? (
        <div className="column-empty">
          <span className="column-empty__mark" aria-hidden="true" />
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어로 제목과 요약을 다시 찾아보세요.</p>
          <a className="column-empty__link" href={basePath}>전체 글 보기</a>
        </div>
      ) : columnPage.items.length === 0 ? (
        <div className="column-empty">
          <span className="column-empty__mark" aria-hidden="true" />
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
              <a href={columnArchiveUrl(columnPage.page - 1, searchQuery, basePath)} rel="prev">← 이전</a>
            )}
          </div>
          <ol className="column-pagination__pages">
            {Array.from({ length: columnPage.pageCount }, (_, index) => index + 1).map((page) => (
              <li key={page}>
                <a
                  href={columnArchiveUrl(page, searchQuery, basePath)}
                  aria-current={page === columnPage.page ? 'page' : undefined}
                  aria-label={`${page}페이지`}
                >
                  {page}
                </a>
              </li>
            ))}
          </ol>
          <div className="column-pagination__direction column-pagination__direction--next">
            {columnPage.page < columnPage.pageCount && (
              <a href={columnArchiveUrl(columnPage.page + 1, searchQuery, basePath)} rel="next">다음 →</a>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
