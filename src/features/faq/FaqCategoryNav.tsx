import Link from 'next/link';

import { faqSectionPath } from './faq-model';
import type { FaqCollection } from './faq-source';

export default function FaqCategoryNav({ collection, sectionSlug }: {
  collection: FaqCollection;
  sectionSlug: string;
}) {
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
    </div>
  );
}
