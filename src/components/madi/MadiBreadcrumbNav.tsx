'use client';

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { communityNav, gnb, isBlogPath, isNavChildActive, mainSiteOrigin } from '../../data/nav';
import type { SchemaBreadcrumb } from '../../features/seo/schema';

/** 원본 depthMenu. 고정 위치로 열어 깊은 경로의 가로 스크롤에 잘리지 않게 한다. */
export default function MadiBreadcrumbNav({
  crumbs,
  selfPath,
}: Readonly<{ crumbs: readonly SchemaBreadcrumb[]; selfPath: string }>) {
  const navigation = useRef<HTMLElement>(null);
  const id = useId();
  const [open, setOpen] = useState<{ index: number; left: number; top: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !navigation.current?.contains(event.target)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      navigation.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus();
      close();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function toggle(index: number, event: MouseEvent<HTMLButtonElement>) {
    if (open?.index === index) {
      setOpen(null);
      return;
    }
    const rect = event.currentTarget.parentElement!.getBoundingClientRect();
    setOpen({ index, left: Math.max(0, Math.min(rect.left, window.innerWidth - 140)), top: rect.bottom + 1 });
  }

  return (
    <nav className="whereIsLine clearFix" aria-label="현재 위치" ref={navigation}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null);
      }}>
      <ul className="whereIs">
        <li><a href={`${mainSiteOrigin}/`} title="처음으로" /></li>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          const items = isBlogPath(selfPath) && index < 2
            ? (index === 0 ? gnb : communityNav.children)
            : null;
          const expanded = open?.index === index;
          return (
            <li key={`${crumb.name}-${index}`} className={items ? undefined : 'breadcrumbLeaf'}>
              {items ? (
                <>
                  <button type="button" className="breadcrumbToggle" aria-expanded={expanded}
                    aria-controls={`${id}-${index}`} onClick={(event) => toggle(index, event)}>
                    {crumb.name}
                  </button>
                  <ul id={`${id}-${index}`} className="depthMenu clearFix"
                    style={{ display: expanded ? 'block' : 'none', position: 'fixed', left: open?.left, top: open?.top }}>
                    {items.map((item) => {
                      const active = index === 0 ? item === communityNav : isNavChildActive(item.href, selfPath);
                      return (
                        <li key={item.href} className={active ? 'on clearFix' : 'clearFix'}>
                          <a href={item.href} aria-current={active ? 'true' : undefined}>{item.label}</a>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : crumb.href && !last ? (
                <a href={crumb.href}>{crumb.name}</a>
              ) : <span aria-current={last ? 'page' : undefined}>{crumb.name}</span>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
