import {
  breadcrumbJsonLd as schemaBreadcrumbJsonLd,
  type SchemaBreadcrumb,
} from '../../features/seo/schema';

/**
 * IA §5: "브레드크럼 전 페이지 적용: 홈 > 대메뉴 > 서브메뉴".
 *
 * 질환 트리는 자체 프레임(`dx-breadcrumb`)이 그 역할을 이미 쓴다. 프레임 없는
 * 문서 라우트와 후기·칼럼 목록/상세는 이 컴포넌트로 화면과 구조화 데이터가
 * 같은 경로 배열을 공유한다.
 *
 * 시각 요소와 JSON-LD를 한 곳에서 만드는 것이 핵심이다. 화면의 경로와 구조화
 * 데이터의 경로가 갈라지면 검색엔진에는 없는 계층이 보이고, 그 차이는 배포
 * 후에야 드러난다. 같은 배열에서 둘 다 나오면 갈라질 수 없다.
 */

export type BreadcrumbCrumb = SchemaBreadcrumb;

/**
 * `BreadcrumbList` 구조화 데이터. 라우트가 자기 JSON-LD `@graph`에 끼워 넣는다.
 * 마지막 항목도 `item`을 갖는다(자기 자신의 절대 URL) — 크롤러가 위치를 확정할
 * 수 있어야 하기 때문이다.
 */
export function breadcrumbJsonLd(crumbs: readonly BreadcrumbCrumb[], selfPath: string) {
  return schemaBreadcrumbJsonLd(crumbs, selfPath);
}

export default function SiteBreadcrumb({ crumbs }: Readonly<{ crumbs: readonly BreadcrumbCrumb[] }>) {
  const lastIndex = crumbs.length - 1;

  return (
    <nav className="site-breadcrumb" aria-label="현재 위치">
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={crumb.name}>
            {crumb.href ? (
              <a href={crumb.href}>{crumb.name}</a>
            ) : (
              <span aria-current="page">{crumb.name}</span>
            )}
            {index < lastIndex && (
              <span className="site-breadcrumb__sep" aria-hidden="true">
                &gt;
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
