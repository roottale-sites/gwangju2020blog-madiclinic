'use client';

import Form from 'next/form';
import { useEffect, useId, useRef, useState } from 'react';

export default function ArchiveSearchField({ basePath, searchQuery, label, hiddenFields = {} }: {
  basePath: string;
  searchQuery: string;
  label: string;
  hiddenFields?: Record<string, string>;
}) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(Boolean(searchQuery));
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) input.current?.focus({ preventScroll: true });
  }, [isOpen]);

  return (
    <div className="archive-search" data-open={isOpen} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggle.current?.focus();
      }
    }}>
      <button
        ref={toggle}
        className="archive-search__toggle"
        type="button"
        aria-label={`${label} 검색 ${isOpen ? '닫기' : '열기'}`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m16 16 4.2 4.2" />
        </svg>
      </button>
      <div id={`${id}-panel`} className="archive-search__panel" inert={!isOpen}>
        <Form action={basePath} role="search" aria-label={`${label} 검색`}>
          <label htmlFor={`${id}-query`}>{label} 검색</label>
          {Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          <div className="archive-search__control">
            <input ref={input} id={`${id}-query`} name="q" type="search"
              defaultValue={searchQuery} placeholder="제목 또는 요약 검색" />
            <button type="submit">검색</button>
          </div>
        </Form>
      </div>
    </div>
  );
}
