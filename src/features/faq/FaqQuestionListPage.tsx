import Link from 'next/link';
import type { ReactNode } from 'react';
import ArchivePagination from '../../components/site/ArchivePagination';
import { webPageJsonLd } from '../seo/schema';
import { faqNotices } from './faq-content';
import {
  FAQ_INTENTS,
  faqEntryPath,
  type FaqEntry,
  type FaqIntent,
} from './faq-model';
import type { FaqCollection } from './faq-source';
import { faqPaginationUrl, paginateFaqEntries } from './faq-pagination';
import FaqPageFrame from './FaqPageFrame';
import {
  FaqEmpty,
  FaqReviewer,
  FaqSidebarBox,
  FaqSourceNotice,
} from './FaqShared';

/**
 * 질문 목록 — `/faq/{section}/{topic}` 세부 질환, 그리고 세부 질환 없이 질문을 바로
 * 담은 `/faq/{section}` 진료 영역이 같은 화면을 쓴다.
 *
 * 질문 성격은 오른쪽 목차에서 GET 쿼리(`?intent=`)로 고른다.
 * 본문 위 중복 필터는 두지 않고 canonical은 이 주소로 둔다(ADR-0006 §5).
 */
export default function FaqQuestionListPage({
  collection,
  path,
  crumbs,
  name,
  pageTitle,
  seoDescription,
  entries: allEntries,
  nav,
  selectedIntent,
  requestedPage = 1,
}: Readonly<{
  collection: FaqCollection;
  path: string;
  crumbs: readonly { name: string; href: string }[];
  /** 목차 제목에 쓰는 분류 이름. */
  name: string;
  pageTitle: string;
  seoDescription: string;
  entries: readonly FaqEntry[];
  nav?: ReactNode;
  selectedIntent?: FaqIntent;
  requestedPage?: number;
}>) {
  const entries = selectedIntent
    ? allEntries.filter((entry) => entry.intent === selectedIntent)
    : allEntries;
  const faqPage = paginateFaqEntries(entries, requestedPage);
  const questionGroups = (selectedIntent ? [selectedIntent] : FAQ_INTENTS)
    .map((intent) => ({ intent, entries: faqPage.items.filter((entry) => entry.intent === intent) }))
    .filter((group) => group.entries.length > 0);

  return (
    <FaqPageFrame
      pathname={path}
      crumbs={crumbs}
      jsonLd={[
        webPageJsonLd({
          path,
          name: pageTitle,
          description: seoDescription,
          type: 'CollectionPage',
        }),
      ]}
    >
      <FaqSourceNotice status={collection.status} />
      <div className="faq-layout">
        <div id="faq-question-list" className="faq-layout__main">
          {nav}
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
        <aside className="faq-sidebar" aria-label={`${name} 질문 목차`}>
          <FaqSidebarBox title={`${name} 질문 목차`}>
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
