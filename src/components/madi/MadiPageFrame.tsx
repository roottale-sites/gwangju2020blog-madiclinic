import type { ReactNode } from 'react';

import MadiBreadcrumb from './MadiBreadcrumb';
import MadiCommunityNav from './MadiCommunityNav';
import type { SchemaBreadcrumb } from '../../features/seo/schema';
import { isBlogPath } from '../../data/nav';

/**
 * 사진 배너 없이 페이지별 탐색·본문을 배치한다(PLAN.md §2.2).
 *
 * 헤더·푸터는 SiteLayout에 유지하고 페이지별 영역만 교체한다.
 *
 * madi-page-frame의 상단 여백이 고정 헤더 높이(PC 140px·모바일 120px)를 확보한다.
 *
 * `pathname`은 페이지가 넘기며 하위 메뉴 표시·브레드크럼 JSON-LD에 사용한다.
 */
export default function MadiPageFrame({
  pathname,
  title,
  crumbs,
  children,
}: Readonly<{
  pathname: string;
  title: string;
  crumbs: readonly SchemaBreadcrumb[];
  children: ReactNode;
}>) {
  return (
    <div className="madi-page-frame">
      {isBlogPath(pathname) ? <MadiCommunityNav pathname={pathname} /> : null}
      <div id="subContainer" className="clearFix">
        <MadiBreadcrumb crumbs={crumbs} selfPath={pathname} />
        <main id="main" aria-label={title} className="cBoxArea community-content clearFix">
          <h2 className="rt-sr-only">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
