import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../../styles/site/faq.css';
import '../../../../styles/site/faq-responsive.css';
import FaqStatePage, { faqStateMetadata } from '../../../../features/faq/FaqStatePage';
import FaqTopicPage from '../../../../features/faq/FaqTopicPage';
import { faqTitleWithSuffix } from '../../../../features/faq/faq-content';
import { FAQ_INTENTS, faqTopicPath, type FaqIntent } from '../../../../features/faq/faq-model';
import { faqSectionBySlug, faqTopicBySlug } from '../../../../features/faq/faq-registry';
import { resolveFaqCollection } from '../../../../features/faq/faq-source';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ section: string; topic: string }>;
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

async function resolveRoute(params: Props['params']) {
  const raw = await params;
  const sectionSlug = decode(raw.section);
  const topicSlug = decode(raw.topic);
  const collection = await resolveFaqCollection();
  const section = faqSectionBySlug(collection.taxonomy, sectionSlug);
  const topic = section ? faqTopicBySlug(collection.taxonomy, section.slug, topicSlug) : undefined;
  return { collection, section, topic, path: faqTopicPath(sectionSlug, topicSlug) };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { collection, section, topic } = await resolveRoute(params);
  if (collection.status !== 'ok') return faqStateMetadata(collection.status);
  if (!section || !topic) return {};
  const path = faqTopicPath(section.slug, topic.slug);
  const intent = selectedIntent((await searchParams).intent);
  return {
    title: { absolute: faqTitleWithSuffix(topic.pageTitle) },
    description: topic.seoDescription,
    // 필터는 같은 질문의 다른 조합이라 색인하지 않고 canonical은 상위 주소로 둔다.
    alternates: { canonical: path },
    robots: intent ? { index: false, follow: true } : undefined,
  };
}

export default async function FaqTopicRoute({ params, searchParams }: Props) {
  const { collection, section, topic, path } = await resolveRoute(params);
  if (collection.status !== 'ok') {
    return <FaqStatePage pathname={path} status={collection.status} />;
  }
  if (!section || !topic) notFound();
  return (
    <FaqTopicPage
      collection={collection}
      section={section}
      topic={topic}
      selectedIntent={selectedIntent((await searchParams).intent)}
    />
  );
}
