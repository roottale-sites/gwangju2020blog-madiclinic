import Link from 'next/link';
import ArchivePagination from '../../components/site/ArchivePagination';
import { webPageJsonLd } from '../seo/schema';
import { faqNotices } from './faq-content';
import {
  FAQ_INTENTS,
  entriesForTopic,
  faqEntryPath,
  faqSectionPath,
  faqTopicPath,
  type FaqIntent,
  type FaqSection,
  type FaqTopic,
} from './faq-model';
import type { FaqCollection } from './faq-source';
import { faqPaginationUrl, paginateFaqEntries } from './faq-pagination';
import FaqPageFrame, { FAQ_BREADCRUMB_ROOT } from './FaqPageFrame';
import FaqCategoryNav from './FaqCategoryNav';
import {
  FaqEmpty,
  FaqReviewer,
  FaqSidebarBox,
  FaqSourceNotice,
} from './FaqShared';

/**
 * `/faq/{section}/{topic}` 세부 질환 — 질문 목록.
 *
 * 질문 성격 필터는 GET 쿼리(`?intent=`)를 쓰고 canonical은 이 주소로 둔다
 * (ADR-0006 §5). headnerve 구조 그대로이며 카페 링크·의사 사진만 없다.
 */
export default function FaqTopicPage({ collection, section, topic, selectedIntent, requestedPage = 1 }: Readonly<{
  collection: FaqCollection;
  section: FaqSection;
  topic: FaqTopic;
  selectedIntent?: FaqIntent;
  requestedPage?: number;
}>) {
  const path = faqTopicPath(section.slug, topic.slug);
  const allEntries = entriesForTopic(collection.archive.entries, section.slug, topic.slug);
  const entries = selectedIntent
    ? allEntries.filter((entry) => entry.intent === selectedIntent)
    : allEntries;
  const faqPage = paginateFaqEntries(entries, requestedPage);
  const questionGroups = (selectedIntent ? [selectedIntent] : FAQ_INTENTS)
    .map((intent) => ({ intent, entries: faqPage.items.filter((entry) => entry.intent === intent) }))
    .filter((group) => group.entries.length > 0);
  const crumbs = [
    ...FAQ_BREADCRUMB_ROOT,
    { name: section.name, href: faqSectionPath(section.slug) },
    { name: topic.name, href: path },
  ];

  return (
    <FaqPageFrame
      pathname={path}
      crumbs={crumbs}
      jsonLd={[
        webPageJsonLd({
          path,
          name: topic.pageTitle,
          description: topic.seoDescription,
          type: 'CollectionPage',
        }),
      ]}
    >
      <FaqSourceNotice status={collection.status} />
      <div className="faq-layout">
        <div id="faq-question-list" className="faq-layout__main">
          <FaqCategoryNav collection={collection} sectionSlug={section.slug} topicSlug={topic.slug} />
          <nav className="faq-filter" aria-label="질문 분류">
            <Link href={path} aria-current={!selectedIntent ? 'page' : undefined}>
              전체 {allEntries.length}
            </Link>
            {FAQ_INTENTS.map((intent) => {
              const count = allEntries.filter((entry) => entry.intent === intent).length;
              return count > 0 ? (
                <Link
                  href={`${path}?intent=${encodeURIComponent(intent)}`}
                  aria-current={selectedIntent === intent ? 'page' : undefined}
                  key={intent}
                >
                  {intent} {count}
                </Link>
              ) : null;
            })}
          </nav>
          <div className="faq-question-groups">
            {questionGroups.map((group) => (
              <section className="faq-question-group" aria-labelledby={`faq-intent-${group.intent}`} key={group.intent}>
                <h3 id={`faq-intent-${group.intent}`}>
                  {group.intent} <span>({group.entries.length})</span>
                </h3>
                <ol className="faq-question-list">
                  {group.entries.map((entry) => (
                    <li key={entry.slug}>
                      <Link href={faqEntryPath(entry)}>
                        <span className="faq-question-list__mark">Q.</span>
                        <strong>{entry.question}</strong>
                        <span className="faq-question-list__answer">
                          <b>A.</b>
                          <span>{entry.answer}</span>
                        </span>

                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          {entries.length === 0 && collection.status === 'ok' && (
            <FaqEmpty message={selectedIntent ? faqNotices.emptyIntent : faqNotices.emptyEntries} />
          )}
          {collection.status === 'ok' && faqPage.total > 0 && (
            <ArchivePagination
              label="FAQ 페이지"
              page={faqPage.page}
              pageCount={faqPage.pageCount}
              hrefForPage={(page) => faqPaginationUrl(path, page, selectedIntent)}
            />
          )}
        </div>
        <aside className="faq-sidebar" aria-label={`${topic.name} 질문 목차`}>
          <FaqSidebarBox title={`${topic.name} 질문 목차`}>
            <ol className="faq-sidebar-list">
              {FAQ_INTENTS.flatMap((intent) => {
                const count = allEntries.filter((entry) => entry.intent === intent).length;
                return count > 0
                  ? [
                      <li key={intent}>
                        <Link href={`${path}?intent=${encodeURIComponent(intent)}`}>
                          <span>{intent}</span>
                          <b>{count}</b>
                        </Link>
                      </li>,
                    ]
                  : [];
              })}
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
