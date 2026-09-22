import Link from 'next/link';
import type { ReactNode } from 'react';

import ArchiveSearchField from './ArchiveSearchField';

export default function ArchiveToolbar({ label, headingId, basePath, searchQuery, total, resetHref, hiddenFields, categoryNavigation }: {
  label: string;
  headingId: string;
  basePath: string;
  searchQuery: string;
  total?: number;
  resetHref: string;
  hiddenFields?: Record<string, string>;
  categoryNavigation: ReactNode;
}) {
  const resultText = searchQuery ? `검색 결과 ${total}건` : `총 ${total}건`;
  return (
    <div className="archive-toolbar">
      <h2 id={headingId} className="community-sr-only">{label} 목록</h2>
      {categoryNavigation}
      <div className="archive-toolbar__tools">
        <ArchiveSearchField key={`${resetHref}:${searchQuery}`} basePath={basePath} searchQuery={searchQuery} label={label} hiddenFields={hiddenFields} />
        {total !== undefined && (
          <div className="archive-toolbar__result">
            <p aria-label={resultText}>{resultText}</p>
            {searchQuery && <Link className="archive-search__reset" href={resetHref} scroll={false}>
              전체 글 보기 <span aria-hidden="true">↺</span>
            </Link>}
          </div>
        )}
      </div>
    </div>
  );
}
