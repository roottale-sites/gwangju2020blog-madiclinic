import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RootAnalyticsClient } from './RootAnalyticsClient';

const hooks = vi.hoisted(() => ({
  refs: [] as { current: unknown }[],
  index: 0,
  effect: undefined as (() => void | (() => void)) | undefined,
  url: new URL('https://site.test/column'),
}));

vi.mock('react', () => ({
  useRef: (value: unknown) => hooks.refs[hooks.index++] ??= { current: value },
  useEffect: (effect: () => void | (() => void)) => { hooks.effect = effect; },
}));
vi.mock('next/navigation', () => ({
  usePathname: () => hooks.url.pathname,
  useSearchParams: () => hooks.url.searchParams,
}));
vi.mock('@roottale/analytics-runtime', async (importOriginal) => ({
  ...await importOriginal<typeof import('@roottale/analytics-runtime')>(),
  initObservers: vi.fn(),
  teardownObservers: vi.fn(),
}));

let browser: EventTarget & { __rtTrack?: ReturnType<typeof vi.fn> };
let cleanup: (() => void) | undefined;

function render(url: string) {
  cleanup?.();
  hooks.url = new URL(url, 'https://site.test');
  hooks.index = 0;
  vi.stubGlobal('location', hooks.url);
  RootAnalyticsClient();
  cleanup = hooks.effect?.() || undefined;
}

beforeEach(() => {
  hooks.refs = [];
  hooks.effect = undefined;
  cleanup = undefined;
  browser = Object.assign(new EventTarget(), { __rtTrack: vi.fn() });
  vi.stubGlobal('window', browser);
  vi.stubGlobal('document', { referrer: '', querySelector: () => null });
  vi.stubGlobal('navigator', { language: 'ko-KR' });
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem: vi.fn() });
});
afterEach(() => {
  cleanup?.();
  vi.unstubAllGlobals();
});

it('최초 조회는 비콘에 맡기고 경로·검색 조건 변경마다 내부 이동을 한 번 보낸다', () => {
  render('/column?utm_source=naver');
  render('/column?utm_source=naver');
  expect(browser.__rtTrack).not.toHaveBeenCalled();

  render('/faq');
  render('/faq?q=private');
  render('/faq?q=private');
  render('/faq');
  expect(browser.__rtTrack?.mock.calls).toEqual([
    ['pageview', { nv: 3, ref: 1, pid: undefined, lg: 'ko' }],
    ['pageview', { nv: 3, ref: 1, pid: undefined, lg: 'ko' }],
    ['pageview', { nv: 3, ref: 1, pid: undefined, lg: 'ko' }],
  ]);
});

it('비콘이 늦게 준비되거나 effect가 다시 연결돼도 최초 조회를 중복하지 않는다', () => {
  delete browser.__rtTrack;
  render('/column');
  browser.__rtTrack = vi.fn();
  browser.dispatchEvent(new Event('rt:analytics-ready'));
  render('/column');
  expect(browser.__rtTrack).not.toHaveBeenCalled();

  render('/reviews');
  expect(browser.__rtTrack).toHaveBeenCalledTimes(1);
  expect(browser.__rtTrack).toHaveBeenCalledWith('pageview', expect.objectContaining({ nv: 3 }));
});

it('글 상세 이동에서 콘텐츠 ID와 언어를 유지한다', () => {
  render('/column');
  vi.stubGlobal('document', {
    referrer: '',
    querySelector: () => ({ getAttribute: () => 'fixture-post' }),
  });
  render('/column/topic/article');
  expect(browser.__rtTrack).toHaveBeenCalledWith('pageview', {
    nv: 3, ref: 1, pid: 'fixture-post', lg: 'ko',
  });
});

it('미리보기는 페이지 조회를 보내지 않는다', () => {
  render('/column');
  render('/preview/post/fixture');
  expect(browser.__rtTrack).not.toHaveBeenCalled();
});
