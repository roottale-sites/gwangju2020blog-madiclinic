import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../../../styles/site/faq.css';
import '../../../../../styles/site/faq-detail.css';
import '../../../../../styles/site/post-pattern.css';
import FaqDetailPage from '../../../../../features/faq/FaqDetailPage';
import FaqStatePage, { faqStateMetadata } from '../../../../../features/faq/FaqStatePage';
import { faqDescription, faqTitleWithSuffix } from '../../../../../features/faq/faq-content';
import { faqEntryPath } from '../../../../../features/faq/faq-model';
import { faqSectionBySlug, faqTopicBySlug } from '../../../../../features/faq/faq-registry';
import { resolveFaqDetailCollection } from '../../../../../features/faq/faq-source';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ section: string; topic: string; slug: string }> };

function decode(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

async function resolveRoute(params: Props['params']) {
  const raw = await params;
  const sectionSlug = decode(raw.section);
  const topicSlug = decode(raw.topic);
  const slug = decode(raw.slug);
  const collection = await resolveFaqDetailCollection(sectionSlug, topicSlug, slug);
  const section = faqSectionBySlug(collection.taxonomy, sectionSlug);
  const topic = section ? faqTopicBySlug(collection.taxonomy, section.slug, topicSlug) : undefined;
  return {
    collection,
    section,
    topic,
    entry: collection.entry,
    path: faqEntryPath({ sectionSlug, topicSlug, slug }),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection, entry } = await resolveRoute(params);
  if (collection.status !== 'ok') return faqStateMetadata(collection.status);
  if (!entry) return {};
  return {
    title: { absolute: faqTitleWithSuffix(entry.question) },
    description: faqDescription(entry.answer),
    alternates: { canonical: faqEntryPath(entry) },
    ...(entry.contentId ? { other: { 'rt:content-id': entry.contentId } } : {}),
  };
}

export default async function FaqDetailRoute({ params }: Props) {
  const { collection, section, topic, entry, path } = await resolveRoute(params);
  if (collection.status !== 'ok') {
    return <FaqStatePage pathname={path} status={collection.status} />;
  }
  if (!section || !topic || !entry) notFound();
  return (
    <FaqDetailPage collection={collection} entry={entry} section={section} topic={topic} />
  );
}
