import { bindGroup, present, safeContentHref, type SiteContent } from '../site-content/bindings';
import { phoneFromDisplay } from '../site-content/phone';
import { commonDefaults } from '../site-content/defaults';
import { clinic } from '../../data/clinic';
import { mainSiteOrigin } from '../../data/nav';
import { siteOrigin, siteUrl } from '../../data/site';

export type JsonLdNode = Readonly<Record<string, unknown>>;
export type SchemaBreadcrumb = Readonly<{ name: string; href?: string }>;
export type SchemaFaq = Readonly<{ question: string; answer: string }>;

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
export function contentEntityJsonLd(content?: SiteContent): readonly JsonLdNode[] {
  const shared = bindGroup(content, 'clinic-common', 'shared', commonDefaults);
  const facts = shared.clinic;
  const phone = phoneFromDisplay(facts.phoneDisplay);
  return [
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
    description: facts.schema.description,
    ...(phone ? { telephone: phone.e164 } : {}),
    faxNumber: facts.faxDisplay,
    email: facts.email,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: '사업자등록번호',
      value: facts.businessNumber,
    },
    address: { '@type': 'PostalAddress', ...facts.schema.address },
    availableService: facts.schema.availableServiceNames.filter(present).map((name) => ({
      '@type': 'MedicalProcedure',
      name,
    })),
    sameAs: [
      `${mainSiteOrigin}/`,
      facts.social.naverBooking,
      facts.social.kakao,
      facts.social.instagram,
      facts.social.cafe,
      facts.social.blog,
    ].filter(value => safeContentHref(value)),
    employee: { '@id': physicianSchemaId },
  },
  {
    // schema.org의 Physician은 조직·장소 계열이라 사람에게 쓰지 않는다. `@id`는 유지해 글 저자 연결을 지킨다.
    '@type': 'Person',
    '@id': physicianSchemaId,
    name: facts.representative,
    image: siteUrl(clinic.doctorPortrait.src),
    ...(present(shared.physician.alternateName) ? { alternateName: shared.physician.alternateName } : {}),
    url: `${mainSiteOrigin}/doctor/doctor01.html`,
    jobTitle: facts.representativeTitle,
    description: facts.schema.physician.description,
    worksFor: { '@id': clinicSchemaId },
  },
];
}

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
 * 저자는 대표원장(`Person`), 발행자는 병원(`MedicalClinic`)이며 둘 다 사이트
 * 주체 그래프의 노드를 참조한다. 같은 주체를 라우트마다 새로 선언하면 크롤러가
 * 서로 다른 주체로 읽는다.
 */
export function articleJsonLd({
  path,
  headline,
  description,
  publishedAt,
  updatedAt,
  section,
  image,
  source,
}: Readonly<{
  path: string;
  headline: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  section?: string;
  /** 절대 주소. 검색 미리보기·AI 인용용이며 없으면 필드를 생략한다. */
  image?: string;
  source?: { name: string; url: string };
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
    ...(section ? { articleSection: section } : {}),
    inLanguage: 'ko-KR',
    ...(source
      ? { isBasedOn: { '@type': 'CreativeWork', name: source.name, url: source.url } }
      : { author: { '@id': physicianSchemaId } }),
    publisher: { '@id': clinicSchemaId },
    mainEntityOfPage: { '@id': pageSchemaId(path) },
  };
}

/**
 * 한 페이지 안의 질문·답변 묶음(`FAQPage`).
 *
 * 후기 상세의 FAQ 블록과 7단계 FAQ 상세가 같이 쓴다. 항목이 없으면 null이라
 * 호출부가 빈 `mainEntity`를 내보내지 않는다(구조화 데이터 오류가 된다).
 */
export function faqPageJsonLd(path: string, items: readonly SchemaFaq[]): JsonLdNode | null {
  if (items.length === 0) return null;

  return {
    '@type': 'FAQPage',
    '@id': `${siteUrl(path)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: plainSchemaText(item.question),
      acceptedAnswer: { '@type': 'Answer', text: plainSchemaText(item.answer) },
    })),
  };
}
