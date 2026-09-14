import { describe, expect, it } from 'vitest';

import { branchTabs, gnb, isBlogPath, isNavChildActive, mainSiteOrigin, topLinks } from './nav';

describe('GNB 구성', () => {
  it('1차 메뉴는 5개다 - header.css의 li 폭(95/95/95/140/95 = 520px)이 5개 기준이다', () => {
    expect(gnb).toHaveLength(5);
  });

  it('기존 4개는 본 사이트 절대주소로, 5번째만 이 저장소 경로로 연결한다', () => {
    const [...rest] = gnb;
    const blog = rest.pop();
    for (const item of rest) {
      expect(item.href.startsWith(mainSiteOrigin)).toBe(true);
      for (const child of item.children) expect(child.href.startsWith(mainSiteOrigin)).toBe(true);
    }
    expect(blog?.label).toBe('건강정보');
    expect(blog?.href).toBe('/column');
    expect(blog?.children.map((c) => c.href)).toEqual(['/column', '/reviews', '/faq']);
  });

  it('상단 지점 탭은 4개이고 광주 Dr.이 마디만 현재 지점이다', () => {
    expect(branchTabs).toHaveLength(4);
    expect(branchTabs.filter((t) => t.current).map((t) => t.label)).toEqual(['광주 Dr.이 마디']);
  });

  it('상단 아이콘은 5개이고 처음으로는 본 사이트 홈이다 - 이 서브도메인의 / 는 /column으로 301된다', () => {
    expect(topLinks.map((l) => l.className)).toEqual(['home', 'naver', 'kakao', 'instagram', 'youtube']);
    expect(topLinks[0]?.href).toBe(`${mainSiteOrigin}/`);
  });
});

describe('현재 경로 표시', () => {
  it('블로그 라우트와 그 하위 경로에서만 건강정보를 켠다', () => {
    for (const path of ['/column', '/column/knee', '/reviews', '/reviews/abc', '/faq', '/faq/a/b/c']) {
      expect(isBlogPath(path)).toBe(true);
    }
    for (const path of ['/', '/columns', '/preview/post/1']) {
      expect(isBlogPath(path)).toBe(false);
    }
  });

  it('하위 항목은 프리픽스로 판정한다 - /reviews를 볼 때 칼럼(/column)이 켜지면 안 된다', () => {
    expect(isNavChildActive('/column', '/column')).toBe(true);
    expect(isNavChildActive('/column', '/column/knee')).toBe(true);
    expect(isNavChildActive('/column', '/reviews')).toBe(false);
    expect(isNavChildActive('/faq', '/faq/shoulder/frozen/slug')).toBe(true);
  });

  it('본 사이트 절대주소 항목은 켜지 않는다', () => {
    expect(isNavChildActive(`${mainSiteOrigin}/doctor/doctor01.html`, '/column')).toBe(false);
  });
});
