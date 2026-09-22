import { classifyAiReferral } from '@roottale/analytics-runtime/ai-referrals';

export const ENTRY_STORAGE_KEY = '_madi_entry';
const SESSION_IDLE_MS = 30 * 60 * 1000;

/** 수집 API 계약. referrer는 호스트만, 광고 클릭 ID는 존재 여부만 남긴다. */
export type EntryAttribution = {
  lp: string;
  ref: 0 | 1;
  rh?: string;
  air?: string;
  us?: string;
  um?: string;
  uc?: string;
  rs?: string;
  gc?: 1;
};
type EntrySession = { at: number; entry: EntryAttribution };

export function captureEntry(url: URL, referrer: string): EntryAttribution {
  const entry: EntryAttribution = { lp: url.pathname.slice(0, 256), ref: referrer ? 1 : 0 };
  for (const [param, key, limit] of [
    ['utm_source', 'us', 100], ['utm_medium', 'um', 100],
    ['utm_campaign', 'uc', 100], ['rt_src', 'rs', 32],
  ] as const) {
    const value = url.searchParams.get(param)?.trim().slice(0, limit);
    if (value) entry[key] = value;
  }
  if (url.searchParams.has('gclid') || url.searchParams.has('fbclid')) entry.gc = 1;
  try {
    const source = new URL(referrer);
    if (source.hostname !== url.hostname) {
      const host = source.hostname.toLowerCase().replace(/^www\./, '');
      const ai = classifyAiReferral(host);
      if (ai) entry.air = ai;
      else entry.rh = host;
    }
  } catch { /* 출처가 전달되지 않은 방문도 수집한다. */ }
  return entry;
}

function hasSource(entry: EntryAttribution): boolean {
  return Boolean(entry.rh || entry.air || entry.us || entry.um || entry.uc || entry.rs || entry.gc);
}

export function readEntrySession(raw: string | null, now: number): EntrySession | null {
  try {
    const session: unknown = JSON.parse(raw ?? 'null');
    if (!session || typeof session !== 'object' || !('at' in session) ||
      typeof session.at !== 'number' || session.at > now || now - session.at >= SESSION_IDLE_MS ||
      !('entry' in session) || !session.entry || typeof session.entry !== 'object') return null;
    const input = session.entry as Record<string, unknown>;
    if (!('lp' in input) || typeof input.lp !== 'string' || !input.lp.startsWith('/') || input.lp.startsWith('//')) return null;
    const entry: EntryAttribution = { lp: (input.lp.split(/[?#]/)[0] ?? '/').slice(0, 256), ref: input.ref === 1 ? 1 : 0 };
    for (const key of ['rh', 'air', 'us', 'um', 'uc', 'rs'] as const) {
      if (key in input && typeof input[key] === 'string') entry[key] = input[key].slice(0, key === 'rh' ? 253 : key === 'rs' ? 32 : 100);
    }
    if ('gc' in input && input.gc === 1) entry.gc = 1;
    return { at: session.at, entry };
  } catch { return null; }
}

/** 새 유입은 갱신하고, 내부 페이지 이동·새로고침은 같은 유입을 이어 간다. */
export function resolveEntry(current: EntryAttribution, previous: EntrySession | null): EntryAttribution {
  return hasSource(current) || !previous ? current : previous.entry;
}

export function createEntryTracker(url: URL, referrer: string) {
  let saved: EntrySession | null = null;
  try { saved = readEntrySession(sessionStorage.getItem(ENTRY_STORAGE_KEY), Date.now()); } catch { /* 저장 차단 시 메모리에서 유지. */ }
  let entry = resolveEntry(captureEntry(url, referrer), saved);
  let lastActivity = Date.now();
  return {
    current(): EntryAttribution {
      const now = Date.now();
      if (now - lastActivity >= SESSION_IDLE_MS) entry = { lp: location.pathname, ref: 0 };
      lastActivity = now;
      try { sessionStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify({ at: now, entry })); } catch { /* 저장 실패가 클릭을 막지 않는다. */ }
      return entry;
    },
  };
}
