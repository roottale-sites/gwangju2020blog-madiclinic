import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../styles/site/faq.css';
import FaqSectionPage from '../../../features/faq/FaqSectionPage';
import FaqStatePage, { faqStateMetadata } from '../../../features/faq/FaqStatePage';
import { faqTitleWithSuffix } from '../../../features/faq/faq-content';
import { FAQ_INTENTS, faqSectionPath, type FaqIntent } from '../../../features/faq/faq-model';
import { parseFaqPageNumber } from '../../../features/faq/faq-pagination';
import { faqSectionBySlug } from '../../../features/faq/faq-registry';
import { resolveFaqCollection } from '../../../features/faq/faq-source';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function decode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

/** 질문 성격 필터는 알려진 값만 받는다. 그 밖의 값은 필터 없음과 같다. */
function selectedIntent(value: string | string[] | undefined): FaqIntent | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && FAQ_INTENTS.includes(candidate as FaqIntent) ? candidate as FaqIntent : undefined;
}

/**
 * 진료 영역은 CMS 분류에만 있다(PLAN.md §4.2). 그래서 이 라우트의 404 경계는
 * "CMS가 성공했고 그 영역이 없다"일 때만 성립한다. 읽을 수 없는 동안은 상태
 * 화면(200)이다.
 */
async function resolveRoute(params: Props['params']) {
  const sectionSlug = decode((await params).section);
  const collection = await resolveFaqCollection();
  return { collection, section: faqSectionBySlug(collection.taxonomy, sectionSlug), sectionSlug };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { collection, section } = await resolveRoute(params);
  if (collection.status !== 'ok') return faqStateMetadata(collection.status);
  if (!section) return {};
  const query = await searchParams;
  const intent = selectedIntent(query.intent);
  const page = parseFaqPageNumber(Array.isArray(query.page) ? query.page[0] : query.page);
  return {
    title: { absolute: faqTitleWithSuffix(section.pageTitle) },
    description: section.seoDescription,
    alternates: { canonical: faqSectionPath(section.slug) },
    // 질문을 바로 담은 영역의 필터·페이지는 같은 질문의 다른 조합이라 색인하지 않는다.
    robots: intent || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function FaqSectionRoute({ params, searchParams }: Props) {
  const { collection, section, sectionSlug } = await resolveRoute(params);
  if (collection.status !== 'ok') {
    return <FaqStatePage pathname={faqSectionPath(sectionSlug)} status={collection.status} />;
  }
  if (!section) notFound();
  const query = await searchParams;
  return (
    <FaqSectionPage
      collection={collection}
      section={section}
      selectedIntent={selectedIntent(query.intent)}
      requestedPage={parseFaqPageNumber(Array.isArray(query.page) ? query.page[0] : query.page)}
    />
  );
}
