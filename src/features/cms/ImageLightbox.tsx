'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ImageSource = { src: string; alt: string; zoomWidth: number };

/** HTML·Tiptap 본문 모두에 적용한다. 이미 링크나 버튼인 이미지는 원래 동작을 유지한다. */
export function RootTaleImageLightbox({ children, imageSelector = 'img' }: {
  children: ReactNode;
  imageSelector?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLImageElement | null>(null);
  const [selected, setSelected] = useState<ImageSource | null>(null);
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cleanups = new Map<HTMLImageElement, () => void>();

    function enhance() {
      if (!container) return;
      for (const image of container.querySelectorAll<HTMLImageElement>(imageSelector)) {
        if (image.tagName !== 'IMG' || cleanups.has(image) || image.hasAttribute('data-no-zoom') ||
          image.closest('a, button') || image.parentElement?.closest('[role="button"]')) continue;
        const attributes = ['role', 'tabindex', 'aria-label', 'aria-haspopup', 'data-rt-image-zoom'];
        const previous = attributes.map((name) => image.getAttribute(name));
        image.setAttribute('role', 'button');
        image.setAttribute('tabindex', '0');
        image.setAttribute('aria-label', image.alt ? `${image.alt} 확대 보기` : '이미지 확대 보기');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('data-rt-image-zoom', '');

        const open = () => {
          triggerRef.current = image;
          setEnlarged(false);
          setSelected({
            src: image.dataset.fullsizeSrc || image.src,
            alt: image.alt,
            zoomWidth: Math.max(image.naturalWidth, image.getBoundingClientRect().width) * 2,
          });
        };
        const keydown = (event: KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          open();
        };
        image.addEventListener('click', open);
        image.addEventListener('keydown', keydown);
        cleanups.set(image, () => {
          image.removeEventListener('click', open);
          image.removeEventListener('keydown', keydown);
          attributes.forEach((name, index) => {
            const value = previous[index];
            if (value === null || value === undefined) image.removeAttribute(name);
            else image.setAttribute(name, value);
          });
        });
      }
    }

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(container, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      for (const cleanup of cleanups.values()) cleanup();
    };
  }, [children, imageSelector]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selected || !dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = overflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [selected]);

  return (
    <div ref={containerRef} data-rt-image-gallery="" style={{ display: 'contents' }}>
      {children}
      {selected && createPortal(
        <dialog ref={dialogRef} className="rt-cms-image-dialog" aria-label="이미지 확대 보기"
          onClose={() => setSelected(null)}
          onCancel={() => setSelected(null)}
          onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="rt-cms-image-dialog__toolbar">
            <button type="button" aria-pressed={enlarged} onClick={() => setEnlarged(!enlarged)}>
              {enlarged ? '화면에 맞추기' : '2배 확대'}
            </button>
            <button type="button" autoFocus onClick={() => setSelected(null)} aria-label="이미지 확대 닫기">
              닫기 <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="rt-cms-image-dialog__viewport" data-enlarged={enlarged}
            onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
            <img src={selected.src} alt={selected.alt} referrerPolicy="no-referrer"
              style={enlarged ? { width: selected.zoomWidth } : undefined} />
          </div>
        </dialog>, document.body,
      )}
    </div>
  );
}
