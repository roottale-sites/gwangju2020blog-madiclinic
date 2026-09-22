import { isTrackEvent, type TrackEventName } from '@roottale/analytics-runtime/events';
import type { EntryAttribution } from './entry-attribution';

export const CLICK_TARGET_SELECTOR = 'a[href], button, summary, [role="button"], input[type="submit"], input[type="button"], #naviToggle';
export type ClickTracking = { event: TrackEventName; dimensions: Record<string, string> };

export function classifyClick(href: string | null, id: string, placement: string, origin: string): ClickTracking {
  const dimensions: Record<string, string> = { trackPlacement: placement };
  try {
    const target = new URL(href ?? '', origin);
    if (target.protocol === 'tel:') return { event: 'phone_click', dimensions };
    if (target.protocol === 'mailto:') return { event: 'email_click', dimensions };
    if (/(^|\.)booking\.naver\.com$/.test(target.hostname)) {
      return { event: 'booking_click', dimensions: { ...dimensions, trackProvider: 'naver' } };
    }
    if (target.hostname === 'pf.kakao.com') {
      return { event: 'chat_click', dimensions: { ...dimensions, trackProvider: 'kakao' } };
    }
  } catch { /* 링크가 아닌 펼치기·닫기 버튼도 CTA로 수집한다. */ }
  return { event: 'cta_click', dimensions: { ...dimensions, trackCta: id.slice(0, 128) } };
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

export function trackingForElement(element: Element): ClickTracking {
  const explicitEvent = element.getAttribute('data-track');
  if (explicitEvent && isTrackEvent(explicitEvent)) {
    const dimensions: Record<string, string> = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-track-')) {
        const key = attr.name.slice(5).replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
        dimensions[key] = attr.value.slice(0, 128);
      }
    }
    return { event: explicitEvent, dimensions };
  }
  // 입력값이나 검색어는 읽지 않고 조작 이름만 보낸다.
  const id = element.getAttribute('data-analytics-id') || element.getAttribute('aria-label') ||
    element.getAttribute('title') || element.textContent?.trim().replace(/\s+/g, ' ') ||
    element.querySelector('img')?.getAttribute('alt') || element.id || element.tagName.toLowerCase();
  return classifyClick(element.getAttribute('href'), id, placementFor(element), location.origin);
}

/** SDK의 data-track 위임과 중복되지 않게, 문서의 모든 조작 요소를 한 곳에서 수집한다. */
export function bindClickTracking(
  send: (event: TrackEventName, dimensions: Record<string, string>) => void,
  entry: () => EntryAttribution,
): () => void {
  const onClick = (event: MouseEvent) => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const target = event.target instanceof Element ? event.target.closest(CLICK_TARGET_SELECTOR) : null;
    if (!target || target.closest('[inert], [data-analytics-ignore]') ||
      target.matches(':disabled, [aria-disabled="true"]')) return;
    // 팝업·배너 등 SDK 표식이 있는 링크에는 출처만 덧붙인다. SDK가 1회 전송한다.
    const explicit = target.closest('[data-track]');
    if (explicit && event.type === 'click') {
      const attribution = entry();
      explicit.setAttribute('data-track-attr', '1');
      for (const key of ['lp', 'ref', 'rh', 'air', 'us', 'um', 'uc', 'rs', 'gc'] as const) {
        const value = attribution[key];
        if (value === undefined) explicit.removeAttribute(`data-track-${key}`);
        else explicit.setAttribute(`data-track-${key}`, String(value));
      }
      return;
    }
    const tracking = trackingForElement(target);
    send(tracking.event, tracking.dimensions);
  };
  // document에 등록된 SDK 위임보다 먼저 출처를 준비한다.
  window.addEventListener('click', onClick, true);
  window.addEventListener('auxclick', onClick, true);
  return () => {
    window.removeEventListener('click', onClick, true);
    window.removeEventListener('auxclick', onClick, true);
  };
}
