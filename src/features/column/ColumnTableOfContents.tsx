'use client';

import { useEffect, useState } from 'react';

import type { ColumnTableOfContentsItem } from './column-document';

type ColumnTableOfContentsProps = {
  items: readonly ColumnTableOfContentsItem[];
};

function synchronizeColumnHeadingIds(
  items: readonly ColumnTableOfContentsItem[],
): HTMLElement[] {
  const content = document.querySelector<HTMLElement>(
    '.column-detail__reading > :is(.column-richtext, .column-imported-html)',
  );
  if (!content) return [];

  const headings = Array.from(content.querySelectorAll<HTMLElement>('h2, h3'))
    .filter((heading) => Boolean(heading.textContent?.replace(/\s+/g, ' ').trim()));

  return items.flatMap((item, index) => {
    const heading = headings[index];
    if (!heading) return [];

    if (heading.id !== item.id) heading.id = item.id;
    return [heading];
  });
}

function useActiveColumnHeading(items: readonly ColumnTableOfContentsItem[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const headings = synchronizeColumnHeadingIds(items);

    const firstHeading = headings[0];
    if (!firstHeading) return undefined;

    const updateActiveHeading = () => {
      const readingLine = Number.parseFloat(getComputedStyle(firstHeading).scrollMarginTop) || 128;
      const passedHeadings = headings.filter((heading) => heading.getBoundingClientRect().top <= readingLine);
      setActiveId((passedHeadings.at(-1) ?? firstHeading).id);
    };

    updateActiveHeading();
    window.addEventListener('scroll', updateActiveHeading, { passive: true });
    window.addEventListener('resize', updateActiveHeading);

    return () => {
      window.removeEventListener('scroll', updateActiveHeading);
      window.removeEventListener('resize', updateActiveHeading);
    };
  }, [items]);

  return activeId;
}

function TableOfContentsLinks({
  activeId,
  items,
}: Readonly<ColumnTableOfContentsProps & { activeId: string | null }>) {
  return (
    <ol className="column-toc__list">
      {items.map((item) => (
        <li className={item.level === 3 ? 'column-toc__item column-toc__item--nested' : 'column-toc__item'} key={item.id}>
          <a href={`#${item.id}`} aria-current={activeId === item.id ? 'location' : undefined}>
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function ColumnTableOfContents({ items }: Readonly<ColumnTableOfContentsProps>) {
  const activeId = useActiveColumnHeading(items);

  if (items.length === 0) return null;

  return (
    <>
      <aside className="column-toc column-toc--desktop">
        <nav aria-label="칼럼 목차">
          <p className="column-toc__title">목차</p>
          <TableOfContentsLinks activeId={activeId} items={items} />
        </nav>
      </aside>
      <div className="column-toc column-toc--mobile">
        <details>
          <summary>
            <span>목차</span>
            <span className="column-toc__chevron" aria-hidden="true" />
          </summary>
          <nav aria-label="칼럼 목차" onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a[href^="#"]')) {
              event.currentTarget.closest('details')?.removeAttribute('open');
            }
          }}>
            <TableOfContentsLinks activeId={activeId} items={items} />
          </nav>
        </details>
      </div>
    </>
  );
}
