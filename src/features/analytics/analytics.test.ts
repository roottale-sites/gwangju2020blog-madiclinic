import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureEntry, readEntrySession, resolveEntry } from './entry-attribution';
import { bindClickTracking, classifyClick, CLICK_TARGET_SELECTOR } from './click-tracking';

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
    'tel:0626750750', 'mailto:hello@example.com',
    'https://m.booking.naver.com/booking/13/bizes/823238?theme=place',
    'https://booking.naver.com/booking/test',
    'https://pf.kakao.com/_test', 'https://open.kakao.com/o/test',
    'https://talk.naver.com/ct/test',
  ])('연락 링크 %s는 SDK에 맡겨 직접 전송하지 않는다', href => {
    expect(classifyClick(href, '연락하기', 'clinic-guide')).toBeNull();
    expect(classifyClick(href, '연락하기', 'clinic-guide', true)).toBeNull();
  });
  it.each(['/faq', null, 'https://booking.naver.com.evil.test'])(
    '일반 버튼 %s는 기존 계측을 유지한다', href => {
      expect(classifyClick(href, '검색 열기', 'clinic-guide')).toEqual({
        event: 'button_click', dimensions: { trackPlacement: 'clinic-guide', trackButton: '검색 열기' },
      });
    },
  );
});


describe('일반 조작과 명시적 CTA', () => {
  it('같은 링크도 CTA로 지정한 경우에만 CTA 이벤트로 보낸다', () => {
    expect(classifyClick('/faq', '질문하기', 'article')).toMatchObject({ event: 'button_click' });
    expect(classifyClick('/faq', '질문하기', 'article', true)).toEqual({
      event: 'cta_click', dimensions: { trackPlacement: 'article', trackCta: '질문하기', trackKind: 'cta' },
    });
  });
});


describe('SDK 클릭 위임과 사이트 계측 경계', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(['click', 'auxclick'])('%s에서 연락 링크와 CMS 표식을 중복 전송하거나 수정하지 않는다', type => {
    class Link {
      textContent = '연락하기';
      tagName = 'A';
      constructor(readonly href: string, readonly marked = false) {}
      closest(selector: string) {
        if (selector === CLICK_TARGET_SELECTOR) return this;
        if (selector === '[data-track]' && this.marked) return this;
        return null;
      }
      getAttribute(name: string) { return name === 'href' ? this.href : null; }
      hasAttribute() { return false; }
      matches() { return false; }
      setAttribute = vi.fn();
      removeAttribute = vi.fn();
    }
    const listeners = new Map<string, (event: object) => void>();
    const removeEventListener = vi.fn();
    vi.stubGlobal('Element', Link);
    vi.stubGlobal('window', {
      addEventListener: (name: string, listener: (event: object) => void) => listeners.set(name, listener),
      removeEventListener,
    });
    const send = vi.fn();
    const unbind = bindClickTracking(send);
    const targets = [
      new Link('tel:0626750750'), new Link('mailto:hello@example.com'),
      new Link('https://open.kakao.com/o/test'), new Link('/campaign', true),
    ];
    for (const target of targets) {
      listeners.get(type)?.({ type, button: type === 'auxclick' ? 1 : 0, target });
      expect(target.setAttribute).not.toHaveBeenCalled();
      expect(target.removeAttribute).not.toHaveBeenCalled();
    }
    expect(send).not.toHaveBeenCalled();
    listeners.get(type)?.({ type, button: type === 'auxclick' ? 1 : 0, target: new Link('/faq') });
    expect(send).toHaveBeenCalledExactlyOnceWith('button_click', { trackPlacement: 'page', trackButton: '연락하기' });
    unbind();
    expect(removeEventListener).toHaveBeenCalledTimes(2);
  });
});
