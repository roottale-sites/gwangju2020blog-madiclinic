import { describe, expect, it } from 'vitest';
import { captureEntry, readEntrySession, resolveEntry } from './entry-attribution';
import { classifyClick } from './click-tracking';

const origin = 'https://gwangju2020blog.madiclinic.co.kr';

describe('유입 경로와 클릭 연결', () => {
  it('UTM과 첫 페이지를 보존하되 검색어·광고 ID·referrer 경로는 전송하지 않는다', () => {
    const entry = captureEntry(new URL('/column?utm_source=naver&utm_medium=cpc&utm_campaign=autumn&gclid=secret&q=private', origin), 'https://search.naver.com/search.naver?query=private');
    expect(entry).toEqual({ lp: '/column', ref: 1, us: 'naver', um: 'cpc', uc: 'autumn', gc: 1, rh: 'search.naver.com' });
    const saved = readEntrySession(JSON.stringify({ at: 100, entry }), 200);
    expect(resolveEntry(captureEntry(new URL('/faq/headache', origin), `${origin}/column`), saved)).toEqual(entry);
  });
  it('새 외부 유입은 갱신하고 만료되거나 손상된 저장 값은 버린다', () => {
    const first = { at: 100, entry: { lp: '/column', ref: 0 as const, us: 'naver' } };
    const next = captureEntry(new URL('/reviews', origin), 'https://www.google.com/search?q=private');
    expect(resolveEntry(next, first).rh).toBe('google.com');
    expect(readEntrySession(JSON.stringify(first), 1_800_100)).toBeNull();
    expect(readEntrySession('{bad', 200)).toBeNull();
    expect(readEntrySession(JSON.stringify({ at: 100, entry: { lp: '//external.test' } }), 200)).toBeNull();
  });
  it('AI 유입은 호스트 대신 알려진 서비스 이름만 남긴다', () => {
    expect(captureEntry(new URL('/column', origin), 'https://chatgpt.com/c/private')).toEqual({ lp: '/column', ref: 1, air: 'chatgpt' });
  });
  it.each([
    ['tel:0626750750', 'phone_click', undefined],
    ['https://m.booking.naver.com/booking/13/bizes/823238?theme=place', 'booking_click', 'naver'],
    ['https://pf.kakao.com/_test', 'chat_click', 'kakao'],
    ['/faq', 'cta_click', undefined],
    [null, 'cta_click', undefined],
    ['https://booking.naver.com.evil.test', 'cta_click', undefined],
  ])('버튼 %s를 관리자 이벤트로 분류한다', (href, event, provider) => {
    const result = classifyClick(href, '검색 열기', 'clinic-guide', origin);
    expect(result.event).toBe(event);
    expect(result.dimensions.trackPlacement).toBe('clinic-guide');
    expect(result.dimensions.trackProvider).toBe(provider);
  });
});
