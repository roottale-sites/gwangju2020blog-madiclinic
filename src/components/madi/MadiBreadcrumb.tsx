import JsonLd from '../site/JsonLd';
import MadiBreadcrumbNav from './MadiBreadcrumbNav';
import { breadcrumbJsonLd, type SchemaBreadcrumb } from '../../features/seo/schema';

/**
 * 본 사이트 브레드크럼 띠(`.whereIsLine ul.whereIs`) 재현 + BreadcrumbList JSON-LD.
 *
 * 첫 두 단계는 본 사이트와 같은 전체 메뉴·커뮤니티 하위 메뉴를 연다.
 * 더 깊은 CMS 분류는 상위 경로 링크로 두고 구조화 데이터와 같은 경로를 쓴다.
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
      <MadiBreadcrumbNav crumbs={crumbs} selfPath={selfPath} />
      <JsonLd nodes={[breadcrumbJsonLd(crumbs, selfPath)]} />
    </>
  );
}
