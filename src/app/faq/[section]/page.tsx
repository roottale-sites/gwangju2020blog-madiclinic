import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../styles/site/faq.css';
import '../../../styles/site/faq-responsive.css';
import FaqSectionPage from '../../../features/faq/FaqSectionPage';
import FaqStatePage, { faqStateMetadata } from '../../../features/faq/FaqStatePage';
import { faqTitleWithSuffix } from '../../../features/faq/faq-content';
import { faqSectionPath } from '../../../features/faq/faq-model';
import { faqSectionBySlug } from '../../../features/faq/faq-registry';
import { resolveFaqCollection } from '../../../features/faq/faq-source';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ section: string }> };

function decode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection, section } = await resolveRoute(params);
  if (collection.status !== 'ok') return faqStateMetadata(collection.status);
  if (!section) return {};
  return {
    title: { absolute: faqTitleWithSuffix(section.pageTitle) },
    description: section.seoDescription,
    alternates: { canonical: faqSectionPath(section.slug) },
  };
}

export default async function FaqSectionRoute({ params }: Props) {
  const { collection, section, sectionSlug } = await resolveRoute(params);
  if (collection.status !== 'ok') {
    return <FaqStatePage pathname={faqSectionPath(sectionSlug)} status={collection.status} />;
  }
  if (!section) notFound();
  return <FaqSectionPage collection={collection} section={section} />;
}
