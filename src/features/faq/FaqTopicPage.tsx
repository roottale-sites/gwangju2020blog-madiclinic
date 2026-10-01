import { entriesForTopic, faqSectionPath, faqTopicPath, type FaqIntent, type FaqSection, type FaqTopic } from './faq-model';
import type { FaqCollection } from './faq-source';
import { FAQ_BREADCRUMB_ROOT } from './FaqPageFrame';
import FaqQuestionListPage from './FaqQuestionListPage';

/** `/faq/{section}/{topic}` 세부 질환 — 질문 목록. */
export default function FaqTopicPage({ collection, section, topic, selectedIntent, requestedPage = 1 }: Readonly<{
  collection: FaqCollection;
  section: FaqSection;
  topic: FaqTopic;
  selectedIntent?: FaqIntent;
  requestedPage?: number;
}>) {
  const path = faqTopicPath(section.slug, topic.slug);
  return (
    <FaqQuestionListPage
      collection={collection}
      path={path}
      crumbs={[
        ...FAQ_BREADCRUMB_ROOT,
        { name: section.name, href: faqSectionPath(section.slug) },
        { name: topic.name, href: path },
      ]}
      name={topic.name}
      pageTitle={topic.pageTitle}
      seoDescription={topic.seoDescription}
      entries={entriesForTopic(collection.archive.entries, section.slug, topic.slug)}
      selectedIntent={selectedIntent}
      requestedPage={requestedPage}
    />
  );
}
