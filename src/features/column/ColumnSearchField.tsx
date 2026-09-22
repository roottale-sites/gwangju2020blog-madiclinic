'use client';

import Form from 'next/form';
import { useEffect, useRef, useState } from 'react';

export default function ColumnSearchField({ basePath, searchQuery }: {
  basePath: string;
  searchQuery: string;
}) {
  const [isOpen, setIsOpen] = useState(Boolean(searchQuery));
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) input.current?.focus({ preventScroll: true });
  }, [isOpen]);

  return (
    <div className="column-search" data-open={isOpen} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button
        ref={toggle}
        className="column-search__toggle"
        type="button"
        aria-label={isOpen ? '블로그 검색 닫기' : '블로그 검색 열기'}
        aria-expanded={isOpen}
        aria-controls="column-search-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m16 16 4.2 4.2" />
        </svg>
      </button>
      <div id="column-search-panel" className="column-search__panel" inert={!isOpen}>
        <Form action={basePath} role="search" aria-label="블로그 검색">
          <label htmlFor="column-search-query">블로그 검색</label>
          <div className="column-search__control">
            <input ref={input} id="column-search-query" name="q" type="search"
              defaultValue={searchQuery} placeholder="제목 또는 요약 검색" />
            <button type="submit">검색</button>
          </div>
        </Form>
      </div>
    </div>
  );
}
