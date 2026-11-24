'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initObservers, teardownObservers, trackCustomEvent } from '@roottale/analytics-runtime';
import { bindClickTracking } from './click-tracking';
import { createEntryTracker } from './entry-attribution';

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
      // 최초 조회는 비콘이 보낸다. 경로·검색 조건이 바뀐 내부 이동만 기록한다.
      if (lastUrl.current !== null && lastUrl.current !== url) {
        trackCustomEvent('pageview', { nv: 3, ref: 1, pid, lg });
      }
      lastUrl.current = url;
      unbind = bindClickTracking((event, dimensions) => {
        trackCustomEvent(event, { ...dimensions, ...visit.current(), attr: 1, pid, lg });
      });
      initObservers();
    }
    // 스트리밍 응답에서 비콘이 준비된 뒤 관찰자와 클릭 추적을 연결한다.
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
