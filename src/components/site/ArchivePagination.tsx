import Link from 'next/link';

type ArchivePaginationProps = {
  label: string;
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
};

/** 세 목록에서 같은 조작을 제공하고, 페이지가 많아도 번호는 다섯 개만 표시한다. */
export default function ArchivePagination({ label, page, pageCount, hrefForPage }: ArchivePaginationProps) {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);

  return (
    <nav className="archive-pagination" aria-label={label}>
      {page > 1 ? (
        <Link className="archive-pagination__direction" href={hrefForPage(page - 1)} rel="prev">← 이전</Link>
      ) : (
        <span className="archive-pagination__direction" aria-disabled="true">← 이전</span>
      )}
      <ol className="archive-pagination__pages">
        {pages.map((number) => (
          <li key={number}>
            {number === page ? (
              <span aria-current="page" aria-label={`${number}페이지`}>{number}</span>
            ) : (
              <Link href={hrefForPage(number)} aria-label={`${number}페이지`}>{number}</Link>
            )}
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        <Link className="archive-pagination__direction archive-pagination__direction--next" href={hrefForPage(page + 1)} rel="next">다음 →</Link>
      ) : (
        <span className="archive-pagination__direction archive-pagination__direction--next" aria-disabled="true">다음 →</span>
      )}
    </nav>
  );
}
