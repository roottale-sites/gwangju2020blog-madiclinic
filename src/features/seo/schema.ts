import { clinic } from '../../data/clinic';
import { mainSiteOrigin } from '../../data/nav';
import { siteOrigin, siteUrl } from '../../data/site';

export type JsonLdNode = Readonly<Record<string, unknown>>;
export type SchemaBreadcrumb = Readonly<{ name: string; href?: string }>;

const websiteSchemaId = `${siteOrigin}/#website`;
export const clinicSchemaId = `${siteOrigin}/#medical-clinic`;
const physicianSchemaId = `${siteOrigin}/#physician`;

function pageSchemaId(path: string): string {
  return `${siteUrl(path)}#webpage`;
}

function plainSchemaText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function schemaDocument(nodes: readonly JsonLdNode[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export function breadcrumbJsonLd(
  crumbs: readonly SchemaBreadcrumb[],
  selfPath: string,
): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: plainSchemaText(crumb.name),
      item: siteUrl(crumb.href ?? selfPath),
    })),
  };
}

/**
 * 사이트 주체 그래프.
 *
 * 이 저장소는 블로그 서브도메인이라 `WebSite`의 url은 이 호스트지만, 병원
 * 자체를 가리키는 `MedicalClinic`의 `url`은 본 사이트다. 같은 병원을 두 개의
 * 다른 주체로 읽히지 않게 `mainEntityOfPage` 대신 `url`을 본 사이트로 두고
 * `sameAs`에 SNS와 본 사이트를 함께 넣는다.
 */
export const siteEntityJsonLd: readonly JsonLdNode[] = [
  {
    '@type': 'WebSite',
    '@id': websiteSchemaId,
    url: `${siteOrigin}/`,
    name: `${clinic.name} 블로그`,
    inLanguage: 'ko-KR',
    publisher: { '@id': clinicSchemaId },
  },
  {
    '@type': 'MedicalClinic',
    '@id': clinicSchemaId,
    name: clinic.name,
    alternateName: clinic.nameEn,
    url: `${mainSiteOrigin}/`,
    logo: siteUrl('/madi/img/hi_gwangju2020_20240826.png'),
    image: siteUrl('/madi/img/hi_gwangju2020_20240826.png'),
    description: clinic.schema.description,
    telephone: clinic.phoneE164,
    faxNumber: clinic.faxDisplay,
    email: clinic.email,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: '사업자등록번호',
      value: clinic.businessNumber,
    },
    address: { '@type': 'PostalAddress', ...clinic.schema.address },
    availableService: clinic.schema.availableServiceNames.map((name) => ({
      '@type': 'MedicalProcedure',
      name,
    })),
    sameAs: [
      `${mainSiteOrigin}/`,
      clinic.social.naverBooking,
      clinic.social.kakao,
      clinic.social.instagram,
      clinic.social.youtube,
    ],
    employee: { '@id': physicianSchemaId },
  },
  {
    '@type': 'Physician',
    '@id': physicianSchemaId,
    name: clinic.representative,
    url: `${mainSiteOrigin}/doctor/doctor01.html`,
    jobTitle: clinic.schema.physician.jobTitle,
    description: clinic.schema.physician.description,
    worksFor: { '@id': clinicSchemaId },
  },
];

export function webPageJsonLd({
  path,
  name,
  description,
  type = 'WebPage',
}: Readonly<{
  path: string;
  name: string;
  description: string;
  type?: 'CollectionPage' | 'WebPage';
}>): JsonLdNode {
  return {
    '@type': type,
    '@id': pageSchemaId(path),
    url: siteUrl(path),
    name: plainSchemaText(name),
    description: plainSchemaText(description),
    isPartOf: { '@id': websiteSchemaId },
    about: { '@id': clinicSchemaId },
  };
}

/**
 * 글 한 편(칼럼·후기)의 `Article`.
 *
 * 저자는 대표원장(`Physician`), 발행자는 병원(`MedicalClinic`)이며 둘 다 사이트
 * 주체 그래프의 노드를 참조한다. 같은 주체를 라우트마다 새로 선언하면 크롤러가
 * 서로 다른 주체로 읽는다.
 */
export function articleJsonLd({
  path,
  headline,
  description,
  publishedAt,
  updatedAt,
  image,
}: Readonly<{
  path: string;
  headline: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  /** 절대 주소. 검색 미리보기·AI 인용용이며 없으면 필드를 생략한다. */
  image?: string;
}>): JsonLdNode {
  const pageUrl = siteUrl(path);
  return {
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    headline: plainSchemaText(headline),
    description: plainSchemaText(description),
    ...(image ? { image: [image] } : {}),
    datePublished: publishedAt,
    ...(updatedAt ? { dateModified: updatedAt } : {}),
    author: { '@id': physicianSchemaId },
    publisher: { '@id': clinicSchemaId },
    mainEntityOfPage: { '@id': pageSchemaId(path) },
  };
}
