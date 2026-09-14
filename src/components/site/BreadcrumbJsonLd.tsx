import type { BreadcrumbCrumb } from './SiteBreadcrumb';
import { breadcrumbJsonLd } from './SiteBreadcrumb';
import type { JsonLdNode } from '../../features/seo/schema';
import JsonLd from './JsonLd';

/**
 * `BreadcrumbList` 구조화 데이터 한 벌.
 *
 * IA §5는 브레드크럼을 전 페이지에 요구하고, 27개 질환 라우트는 이미 화면에
 * `dx-breadcrumb` 막대를 그리고 있었다. 빠져 있던 것은 같은 계층을 검색엔진에
 * 알리는 구조화 데이터라, 크롤러에게는 트리가 평평하게 보였다.
 *
 * 핵심은 화면과 스키마가 갈라질 수 없게 만드는 것이다. 그래서 이 컴포넌트는
 * 시각 브레드크럼이 렌더하는 바로 그 배열(`crumbs`)을 받고, 문서 라우트가 이미
 * 쓰는 `breadcrumbJsonLd`를 그대로 통과시킨다. 라우트마다 JSON을 손으로 조립하면
 * 그 손이 미끄러진 자리는 배포 후 색인에서야 드러난다.
 *
 * `<`를 이스케이프하는 이유는 하나다. 크럼 이름은 사람이 쓰는 카피이고, 그 안에
 * `</script>`가 들어가면 블록이 조기 종료되며 뒤따르는 문자열이 마크업으로
 * 해석된다. JSON-LD의 유일한 탈출 벡터라 다른 라우트들도 같은 자리에서 막는다.
 */
export default function BreadcrumbJsonLd({
  crumbs,
  path,
  nodes = [],
}: Readonly<{ crumbs: readonly BreadcrumbCrumb[]; path: string; nodes?: readonly JsonLdNode[] }>) {
  return <JsonLd nodes={[...nodes, breadcrumbJsonLd(crumbs, path)]} />;
}
