import Link from 'next/link';
import { webPageJsonLd } from '../seo/schema';
import { faqIndexMetadata, faqNotices } from './faq-content';
import { entriesForSection, faqSectionPath } from './faq-model';
import type { FaqCollection } from './faq-source';
import FaqPageFrame, { FAQ_BREADCRUMB_ROOT } from './FaqPageFrame';
import { FaqEmpty, FaqSourceNotice } from './FaqShared';

/**
 * `/faq` 질문 홈 — 진료 영역 카드.
 *
 * headnerve는 질환 도판 5장 + 병원 내부 사진 1장으로 3×2 이미지 카드를 만들고
 * 여섯 번째 카드를 `/about`으로 보냈다. 이 저장소에는 그 도판도 `/about`도 없으므로
 * (PLAN.md §5.3) 이미지 없이 본 사이트 안내 박스 표면(`.commonBox`, DESIGN.md §5)을
 * 쓰는 카드만 둔다. 영역 목록·이름·설명은 전부 CMS 분류에서 온다.
 */
export default function FaqHomePage({ collection }: Readonly<{ collection: FaqCollection }>) {
  const { taxonomy, archive, status } = collection;

  return (
    <FaqPageFrame
      pathname="/faq"
      crumbs={FAQ_BREADCRUMB_ROOT}
      jsonLd={[
        webPageJsonLd({
          path: '/faq',
          name: faqIndexMetadata.title,
          description: faqIndexMetadata.description,
          type: 'CollectionPage',
        }),
      ]}
    >
      <FaqSourceNotice status={status} />
      {taxonomy.sections.length === 0 ? (
        status === 'ok' ? <FaqEmpty message={faqNotices.emptySections} /> : null
      ) : (
        <div className="faq-section-grid">
          {taxonomy.sections.map((section) => {
            const count = entriesForSection(archive.entries, section.slug).length;
            return (
              <Link className="faq-section-card" href={faqSectionPath(section.slug)} key={section.slug}>
                <h3>{section.name}</h3>
                <p>{section.description}</p>
                <span className="faq-section-card__meta">
                  <b>질문 {count}개</b>
                  <em>
                    질문 보기 <span aria-hidden="true">›</span>
                  </em>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </FaqPageFrame>
  );
}
