import JsonLd from '../site/JsonLd';
import { mainSiteOrigin } from '../../data/nav';
import { breadcrumbJsonLd, type SchemaBreadcrumb } from '../../features/seo/schema';

/**
 * 본 사이트 브레드크럼 띠(`.whereIsLine ul.whereIs`) 재현 + BreadcrumbList JSON-LD.
 *
 * 본 사이트는 각 칸에 형제 메뉴 드롭다운(`ul.depthMenu`)을 달고 JS로 여닫는다.
 * 블로그는 형제 목록을 CMS 분류에서 받아야 해서 아직 만들 수 없으므로 드롭다운
 * 없이 칸만 둔다. 대신 상위 칸을 링크로 만들어 돌아갈 길을 남긴다(원본은 글자).
 *
 * 첫 칸은 원본과 같이 홈 아이콘이다. 이 서브도메인의 `/`는 `/column`으로
 * 301되므로 본 사이트 홈으로 보낸다.
 */
export default function MadiBreadcrumb({
  crumbs,
  selfPath,
}: Readonly<{ crumbs: readonly SchemaBreadcrumb[]; selfPath: string }>) {
  return (
    <>
      <div className="whereIsLine clearFix">
        <ul className="whereIs">
          <li>
            <a href={`${mainSiteOrigin}/`} title="처음으로" />
          </li>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.name}-${index}`}>
                {crumb.href && !isLast ? <a href={crumb.href}>{crumb.name}</a> : crumb.name}
              </li>
            );
          })}
        </ul>
      </div>
      <JsonLd nodes={[breadcrumbJsonLd(crumbs, selfPath)]} />
    </>
  );
}
