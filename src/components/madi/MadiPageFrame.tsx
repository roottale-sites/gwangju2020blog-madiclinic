import type { ReactNode } from 'react';

import MadiBreadcrumb from './MadiBreadcrumb';
import MadiCommunityNav from './MadiCommunityNav';
import MadiSubVisual, { type MadiBannerNo } from './MadiSubVisual';
import type { SchemaBreadcrumb } from '../../features/seo/schema';
import { isBlogPath } from '../../data/nav';

/**
 * 페이지별 배너·탐색·본문 골격(PLAN.md §2.2).
 *
 * 헤더·푸터는 SiteLayout에 유지하고 페이지별 영역만 교체한다.
 *
 * 본문이 고정 헤더(140px, ≤980px 120px)에 가리지 않는 것은 `MadiSubVisual`의
 * `padding-top`이 헤더 높이와 같기 때문이다. 배너를 빼면 본문이 헤더 아래로
 * 들어가므로 이 골격을 우회하지 않는다.
 *
 * `pathname`은 페이지가 넘기며 하위 메뉴 표시·브레드크럼 JSON-LD에 사용한다.
 */
export default function MadiPageFrame({
  pathname,
  title,
  banner,
  crumbs,
  children,
}: Readonly<{
  pathname: string;
  title: string;
  banner: MadiBannerNo;
  crumbs: readonly SchemaBreadcrumb[];
  children: ReactNode;
}>) {
  return (
    <>
      <MadiSubVisual title={title} banner={banner} />
      {isBlogPath(pathname) ? <MadiCommunityNav pathname={pathname} /> : null}
      <div id="subContainer" className="clearFix">
        <MadiBreadcrumb crumbs={crumbs} selfPath={pathname} />
        <main id="main" className="cBoxArea community-content clearFix">
          {children}
        </main>
      </div>
    </>
  );
}
