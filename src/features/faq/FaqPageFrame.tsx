import type { ReactNode } from 'react';

import MadiPageFrame from '../../components/madi/MadiPageFrame';
import JsonLd from '../../components/site/JsonLd';
import type { JsonLdNode, SchemaBreadcrumb } from '../seo/schema';
import { faqIndexMetadata } from './faq-content';

/**
 * FAQ 네 단계가 같이 쓰는 틀.
 *
 * headnerve `FaqPageFrame`은 `SiteLayout` + `SiteHeader` + `SiteClosing`(지도·푸터)
 * 였다. 이 저장소의 골격은 `MadiPageFrame`(헤더 → 서브 배너 03 → 브레드크럼 →
 * main → 푸터, PLAN.md §2.2)이다.
 *
 * 브레드크럼 JSON-LD(`BreadcrumbList`)는 `MadiBreadcrumb`이 같은 `crumbs` 배열에서
 * 만든다. 그래서 여기서 받는 `jsonLd`에는 페이지·FAQPage 노드만 넣는다 — 두 곳에서
 * 만들면 화면과 구조화 데이터가 갈라질 수 있다.
 */
export const FAQ_BREADCRUMB_ROOT = [
  { name: '커뮤니티', href: '/column' },
  { name: faqIndexMetadata.label, href: '/faq' },
] as const;

export default function FaqPageFrame({
  pathname,
  crumbs,
  jsonLd,
  children,
}: Readonly<{
  pathname: string;
  crumbs: readonly SchemaBreadcrumb[];
  jsonLd: readonly JsonLdNode[];
  children: ReactNode;
}>) {
  return (
    <MadiPageFrame
      pathname={pathname}
      title={faqIndexMetadata.label}
      banner="03"
      crumbs={crumbs}
    >
      <JsonLd nodes={jsonLd} />
      <div className="cBox faq-page clearFix">{children}</div>
    </MadiPageFrame>
  );
}
