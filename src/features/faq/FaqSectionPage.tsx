import Link from 'next/link';
import { webPageJsonLd } from '../seo/schema';
import { faqNotices } from './faq-content';
import {
  entriesForSection,
  entriesForTopic,
  faqSectionPath,
  faqTopicPath,
  type FaqSection,
} from './faq-model';
import { faqTopicsForSection } from './faq-registry';
import type { FaqCollection } from './faq-source';
import FaqPageFrame, { FAQ_BREADCRUMB_ROOT } from './FaqPageFrame';
import {
  FaqCollectionIntro,
  FaqEmpty,
  FaqReviewer,
  FaqSidebarBox,
  FaqSourceNotice,
} from './FaqShared';

function topicPreview(question: string | undefined): string {
  if (!question) return '공개된 질문이 준비되면 이곳에 표시됩니다.';
  return question.length > 52 ? `${question.slice(0, 52)}…` : question;
}

/**
 * `/faq/{section}` 진료 영역 — 세부 질환 목록.
 *
 * headnerve는 글이 있는 세부 질환만 보여 주고 나머지는 숨겼다. 여기서는 CMS에
 * 만들어진 세부 질환을 모두(질문 0개 포함) 순서대로 보여 준다 — 분류 트리의 권위는
 * CMS이고, 편집자가 만든 영역이 화면에서 사라지면 아직 글이 없다는 사실이 보이지
 * 않는다. 사이트맵은 반대로 글이 있는 분류만 담는다(ADR-0006 §5).
 */
export default function FaqSectionPage({ collection, section }: Readonly<{
  collection: FaqCollection;
  section: FaqSection;
}>) {
  const path = faqSectionPath(section.slug);
  const entries = entriesForSection(collection.archive.entries, section.slug);
  const topics = faqTopicsForSection(collection.taxonomy, section.slug);
  const crumbs = [...FAQ_BREADCRUMB_ROOT, { name: section.name, href: path }];

  return (
    <FaqPageFrame
      pathname={path}
      crumbs={crumbs}
      jsonLd={[
        webPageJsonLd({
          path,
          name: section.pageTitle,
          description: section.seoDescription,
          type: 'CollectionPage',
        }),
      ]}
    >
      <FaqCollectionIntro title={section.name} lead={section.description} />
      <FaqSourceNotice status={collection.status} />
      <div className="faq-layout">
        <div className="faq-layout__main">
          {topics.length === 0 ? (
            collection.status === 'ok' ? <FaqEmpty message={faqNotices.emptyTopics} /> : null
          ) : (
            <ul className="faq-topic-list">
              {topics.map((topic) => {
                const topicEntries = entriesForTopic(entries, section.slug, topic.slug);
                return (
                  <li key={topic.slug}>
                    <Link href={faqTopicPath(section.slug, topic.slug)}>
                      <span className="faq-topic-list__text">
                        <strong>{topic.name}</strong>
                        <small>{topicPreview(topicEntries[0]?.question)}</small>
                      </span>
                      <b className="faq-count">{topicEntries.length}</b>
                      <b className="faq-row-arrow" aria-hidden="true">›</b>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <aside className="faq-sidebar" aria-label={`${section.name} 질문 목차`}>
          <FaqSidebarBox title={`${section.name} 질문 목차`}>
            <ol className="faq-sidebar-list">
              {topics.map((topic) => (
                <li key={topic.slug}>
                  <Link href={faqTopicPath(section.slug, topic.slug)}>
                    <span>{topic.name}</span>
                    <b>{entriesForTopic(entries, section.slug, topic.slug).length}</b>
                  </Link>
                </li>
              ))}
            </ol>
          </FaqSidebarBox>
          <FaqSidebarBox title="답변 작성">
            <FaqReviewer detail="질문 검토 및 답변 작성" />
          </FaqSidebarBox>
        </aside>
      </div>
    </FaqPageFrame>
  );
}
