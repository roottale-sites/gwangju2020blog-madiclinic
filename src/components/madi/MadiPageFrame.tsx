import type { ReactNode } from 'react';

import MadiBreadcrumb from './MadiBreadcrumb';
import MadiFooter from './MadiFooter';
import MadiHeader from './MadiHeader';
import MadiSubVisual, { type MadiBannerNo } from './MadiSubVisual';
import type { SchemaBreadcrumb } from '../../features/seo/schema';

/**
 * 모든 페이지의 공통 골격(PLAN.md §2.2).
 *
 *   MadiHeader -> MadiSubVisual -> MadiBreadcrumb -> <main> -> MadiFooter
 *
 * 본문이 고정 헤더(140px, ≤980px 120px)에 가리지 않는 것은 `MadiSubVisual`의
 * `padding-top`이 헤더 높이와 같기 때문이다. 배너를 빼면 본문이 헤더 아래로
 * 들어가므로 이 골격을 우회하지 않는다.
 *
 * `pathname`은 페이지가 넘긴다. 레이아웃(서버 컴포넌트)에서는 현재 경로를 알 수
 * 없고, 헤더의 `on` 표시와 브레드크럼 JSON-LD가 둘 다 경로를 필요로 한다.
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
      <MadiHeader pathname={pathname} />
      <MadiSubVisual title={title} banner={banner} />
      <div id="subContainer" className="clearFix">
        <MadiBreadcrumb crumbs={crumbs} selfPath={pathname} />
        <main id="main" className="cBoxArea clearFix">
          {children}
        </main>
      </div>
      <MadiFooter />
    </>
  );
}
