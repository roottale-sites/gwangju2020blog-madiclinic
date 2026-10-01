import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import '../../../../styles/site/faq.css';
import '../../../../styles/site/faq-detail.css';
import '../../../../styles/site/post-pattern.css';
import FaqDetailPage from '../../../../features/faq/FaqDetailPage';
import FaqStatePage, { faqStateMetadata } from '../../../../features/faq/FaqStatePage';
import FaqTopicPage from '../../../../features/faq/FaqTopicPage';
import { faqDescription, faqTitleWithSuffix } from '../../../../features/faq/faq-content';
import {
  FAQ_INTENTS,
  faqEntryPath,
  faqTopicPath,
  type FaqIntent,
} from '../../../../features/faq/faq-model';
import { faqSectionBySlug, faqTopicBySlug } from '../../../../features/faq/faq-registry';
import { resolveFaqCollection, resolveFaqDetailCollection } from '../../../../features/faq/faq-source';
import { parseFaqPageNumber } from '../../../../features/faq/faq-pagination';

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

/**
 * `/faq/{section}/{두 번째 조각}`은 세부 질환 목록이거나, 세부 질환 없이 진료 영역에
 * 바로 붙은 질문 상세다(CMS 모델 `entryCategory: leaf`). 세부 질환이 먼저다 — CMS가
 * 같은 영역 아래 질환 slug와 질문 slug가 겹치지 않게 막는다.
 */
async function resolveRoute(params: Props['params']) {
  const raw = await params;
  const sectionSlug = decode(raw.section);
  const childSlug = decode(raw.topic);
  const collection = await resolveFaqCollection();
  const section = faqSectionBySlug(collection.taxonomy, sectionSlug);
  const topic = section ? faqTopicBySlug(collection.taxonomy, section.slug, childSlug) : undefined;
  if (topic || collection.status !== 'ok' || !section) {
    return { kind: 'topic' as const, collection, section, topic, path: faqTopicPath(sectionSlug, childSlug) };
  }
  const detail = await resolveFaqDetailCollection(section.slug, null, childSlug);
  return {
    kind: 'entry' as const,
    collection: detail,
    section,
    entry: detail.entry,
    path: faqEntryPath({ sectionSlug: section.slug, topicSlug: null, slug: childSlug }),
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const route = await resolveRoute(params);
  if (route.collection.status !== 'ok') return faqStateMetadata(route.collection.status);
  if (route.kind === 'entry') {
    const { entry } = route;
    if (!entry) return {};
    return {
      title: { absolute: faqTitleWithSuffix(entry.question) },
      description: faqDescription(entry.answer),
      alternates: { canonical: faqEntryPath(entry) },
      // ROOT-ADMIN 공개 화면 반영 확인이 읽는 글 수정 시각 표식.
      other: {
        ...(entry.contentId ? { 'rt:content-id': entry.contentId } : {}),
        'roottale:revision': entry.updatedAt,
      },
    };
  }
  const { section, topic } = route;
  if (!section || !topic) return {};
  const path = faqTopicPath(section.slug, topic.slug);
  const query = await searchParams;
  const intent = selectedIntent(query.intent);
  const page = parseFaqPageNumber(Array.isArray(query.page) ? query.page[0] : query.page);
  return {
    title: { absolute: faqTitleWithSuffix(topic.pageTitle) },
    description: topic.seoDescription,
    // 필터는 같은 질문의 다른 조합이라 색인하지 않고 canonical은 상위 주소로 둔다.
    alternates: { canonical: path },
    robots: intent || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function FaqTopicRoute({ params, searchParams }: Props) {
  const route = await resolveRoute(params);
  if (route.collection.status !== 'ok') {
    return <FaqStatePage pathname={route.path} status={route.collection.status} />;
  }
  if (route.kind === 'entry') {
    if (!route.entry) notFound();
    return <FaqDetailPage collection={route.collection} entry={route.entry} section={route.section} />;
  }
  const { collection, section, topic } = route;
  if (!section || !topic) notFound();
  const query = await searchParams;
  return (
    <FaqTopicPage
      collection={collection}
      section={section}
      topic={topic}
      selectedIntent={selectedIntent(query.intent)}
      requestedPage={parseFaqPageNumber(Array.isArray(query.page) ? query.page[0] : query.page)}
    />
  );
}
