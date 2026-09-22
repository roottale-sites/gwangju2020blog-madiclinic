'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initObservers, teardownObservers, trackCustomEvent } from '@roottale/analytics-runtime';
import { bindClickTracking } from './click-tracking';
import { captureEntry, createEntryTracker } from './entry-attribution';

export function RootAnalyticsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);
  const tracker = useRef<ReturnType<typeof createEntryTracker> | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/preview')) return;
    let unbind: (() => void) | undefined;
    function startTracking() {
      const visit = tracker.current ??= createEntryTracker(new URL(location.href), document.referrer);
      visit.current();
      const url = pathname + '?' + searchParams.toString();
      const language = navigator.language.split('-')[0]?.toLowerCase() ?? '';
      const lg = /^[a-z]{2,8}$/.test(language) ? language : undefined;
      const pid = document.querySelector('[data-track-read]')?.getAttribute('data-track-read') ||
        document.querySelector<HTMLMetaElement>('meta[name="rt:content-id"]')?.content;
      if (lastUrl.current !== url) {
        const acquisition = lastUrl.current === null
          ? captureEntry(new URL(location.href), document.referrer) : { ref: 1 };
        trackCustomEvent('pageview', { ...acquisition, pid, lg });
        lastUrl.current = url;
      }
      unbind = bindClickTracking((event, dimensions) => {
        trackCustomEvent(event, { ...dimensions, ...visit.current(), attr: 1, pid, lg });
      }, () => visit.current());
      initObservers();
    }
    // 스트리밍 응답에서 비콘이 늦게 도착해도 첫 pageview를 놓치지 않는다.
    if (window.__rtTrack) startTracking();
    else window.addEventListener('rt:analytics-ready', startTracking, { once: true });
    return () => {
      window.removeEventListener('rt:analytics-ready', startTracking);
      unbind?.();
      teardownObservers();
    };
  }, [pathname, searchParams]);
  return null;
}
