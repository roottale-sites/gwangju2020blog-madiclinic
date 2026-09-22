import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MadiHeader from './MadiHeader';
import MadiCommunityNav from './MadiCommunityNav';
import MadiBreadcrumb from './MadiBreadcrumb';
import { mainSiteOrigin } from '../../data/nav';

describe('본 사이트와 이어지는 커뮤니티 탐색', () => {
  it('상세 페이지에서도 커뮤니티의 고정 표시와 해당 하위 메뉴 선택을 유지한다', () => {
    const html = renderToStaticMarkup(<MadiHeader pathname="/faq/spine/neck-pain/question" />);
    expect(html).toContain('class="clearFix fix"');
    expect(html).toContain('href="/faq" aria-current="page"');
    expect(html).not.toContain('href="/column" aria-current="page"');
  });

  it('서브 메뉴는 세 커뮤니티 화면으로 같은 탭에서 이동한다', () => {
    const html = renderToStaticMarkup(<MadiCommunityNav pathname="/reviews/example" />);
    expect(html).toContain('href="/column"');
    expect(html).toContain('href="/faq"');
    expect(html).toContain('href="/reviews" aria-current="page"');
    expect(html).not.toContain('target=');
  });

  it('위치 표시줄의 전체 메뉴는 원본으로, 하위 메뉴는 커뮤니티로 연결한다', () => {
    const html = renderToStaticMarkup(<MadiBreadcrumb selfPath="/faq/spine" crumbs={[
      { name: '커뮤니티', href: '/column' },
      { name: '자주 묻는 질문', href: '/faq' },
      { name: '척추', href: '/faq/spine' },
    ]} />);
    expect(html).toContain(`href="${mainSiteOrigin}/"`);
    expect(html).toContain(`href="${mainSiteOrigin}/doctor/doctor01.html"`);
    expect(html).toContain('href="/reviews"');
    expect(html.match(/class="breadcrumbToggle"/g)).toHaveLength(2);
    expect(html).toContain('<span aria-current="page">척추</span>');
  });
});
