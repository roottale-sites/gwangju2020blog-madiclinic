import { contactTrackForHref, type TrackEventName } from '@roottale/analytics-runtime/events';

export const CLICK_TARGET_SELECTOR = 'a[href], button, summary, [role="button"], input[type="submit"], input[type="button"], #naviToggle';
export type ClickTracking = { event: TrackEventName | 'button_click'; dimensions: Record<string, string> };

export function classifyClick(href: string | null, id: string, placement: string, isCta = false): ClickTracking | null {
  // 연락 링크는 0.10 비콘이 수집한다. 일반 버튼으로도 다시 보내지 않는다.
  if (contactTrackForHref(href ?? '')) return null;
  const dimensions: Record<string, string> = { trackPlacement: placement };
  return isCta
    ? { event: 'cta_click', dimensions: { ...dimensions, trackCta: id.slice(0, 128), trackKind: 'cta' } }
    : { event: 'button_click', dimensions: { ...dimensions, trackButton: id.slice(0, 128) } };
}

function placementFor(element: Element): string {
  const explicit = element.closest('[data-analytics-placement]')?.getAttribute('data-analytics-placement');
  if (explicit) return explicit.slice(0, 128);
  for (const [selector, name] of [
    ['#header', 'header'], ['#bottom', 'footer'], ['.whereIsLine', 'breadcrumb'],
    ['.archive-search', 'archive-search'], ['.archive-pagination', 'pagination'],
    ['.column-card, .review-card, .faq-question-list', 'archive'],
    ['.column-toc, .faq-sidebar', 'table-of-contents'], ['dialog', 'image-lightbox'],
    ['article', 'article'], ['main', 'content'], ['#skipBind', 'skip-link'],
  ] as const) if (element.closest(selector)) return name;
  return 'page';
}

export function trackingForElement(element: Element): ClickTracking | null {
  // CMS를 포함한 명시적 표식은 속성을 덧씌우지 않고 SDK에 맡긴다.
  if (element.closest('[data-track]')) return null;
  // 입력값이나 검색어는 읽지 않고 조작 이름만 보낸다.
  const id = element.getAttribute('data-analytics-id') || element.getAttribute('aria-label') ||
    element.getAttribute('title') || element.textContent?.trim().replace(/\s+/g, ' ') ||
    element.querySelector('img')?.getAttribute('alt') || element.id || element.tagName.toLowerCase();
  return classifyClick(element.getAttribute('href'), id, placementFor(element), element.hasAttribute('data-analytics-cta'));
}

/** SDK의 data-track 위임과 중복되지 않게, 표식 없는 일반 조작만 수집한다. */
export function bindClickTracking(
  send: (event: ClickTracking['event'], dimensions: Record<string, string>) => void,
): () => void {
  const onClick = (event: MouseEvent) => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const target = event.target instanceof Element ? event.target.closest(CLICK_TARGET_SELECTOR) : null;
    if (!target || target.closest('[inert], [data-analytics-ignore]') ||
      target.matches(':disabled, [aria-disabled="true"]')) return;
    const tracking = trackingForElement(target);
    if (tracking) send(tracking.event, tracking.dimensions);
  };
  window.addEventListener('click', onClick, true);
  window.addEventListener('auxclick', onClick, true);
  return () => {
    window.removeEventListener('click', onClick, true);
    window.removeEventListener('auxclick', onClick, true);
  };
}
