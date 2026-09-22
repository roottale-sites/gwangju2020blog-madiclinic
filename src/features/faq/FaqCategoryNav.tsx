import Link from 'next/link';

import { faqSectionPath, faqTopicPath } from './faq-model';
import { faqTopicsForSection } from './faq-registry';
import type { FaqCollection } from './faq-source';

export default function FaqCategoryNav({ collection, sectionSlug, topicSlug }: {
  collection: FaqCollection;
  sectionSlug: string;
  topicSlug?: string;
}) {
  const topics = faqTopicsForSection(collection.taxonomy, sectionSlug);
  return (
    <div className="faq-category-nav">
      <nav className="faq-filter" aria-label="FAQ 진료 영역">
        <Link href="/faq">전체</Link>
        {collection.taxonomy.sections.map((section) => (
          <Link key={section.slug} href={faqSectionPath(section.slug)}
            aria-current={section.slug === sectionSlug ? 'page' : undefined}>
            {section.name}
          </Link>
        ))}
      </nav>
      {topicSlug && topics.length > 0 && (
        <nav className="faq-filter faq-filter--topics" aria-label="FAQ 세부 질환">
          <Link href={faqSectionPath(sectionSlug)}>전체 질환</Link>
          {topics.map((topic) => (
            <Link key={topic.slug} href={faqTopicPath(sectionSlug, topic.slug)}
              aria-current={topic.slug === topicSlug ? 'page' : undefined}>
              {topic.name}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
