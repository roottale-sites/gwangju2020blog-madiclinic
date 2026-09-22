import Link from 'next/link';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import { faqPageJsonLd, webPageJsonLd } from '../seo/schema';
import { formatFaqAnswerDate } from './faq-content';
import { faqDetailHeadingId, faqDetailOutline, faqDetailSections as S } from './faq-detail-outline';
import {
  faqEntryPath,
  faqSectionPath,
  faqTopicPath,
  relatedFaqEntries,
  type FaqEntry,
  type FaqSection,
  type FaqTopic,
} from './faq-model';
import type { FaqCollection } from './faq-source';
import FaqPageFrame, { FAQ_BREADCRUMB_ROOT } from './FaqPageFrame';
import { FaqMedicalNote, FaqReviewer, FaqSidebarBox } from './FaqShared';

/**
 * `/faq/{section}/{topic}/{slug}` 답변 상세.
 *
 * headnerve 구조(질문 카드 → 핵심 답변 → 상세 답변 → 관점 → 관련 질문 + 250px
 * 목차 사이드바) 그대로다. 다르게 한 곳
 *   - 하단 병원 안내는 headnerve의 배치값(`pattern_slots`) 대신 칼럼·후기와 같은
 *     `ClinicGuide`(`.commonBox` 진료 안내 박스)다. 세 기능이 같은 박스를 쓴다.
 *   - 사이드바의 "진료가 필요한 경우" 질환 페이지 링크는 없다(질환 라우트가 없다).
 *   - 답변에만 `FAQPage`를 준다(ADR-0006 §5). 목록에는 만들지 않는다.
 */
export default function FaqDetailPage({ collection, entry, section, topic }: Readonly<{
  collection: FaqCollection;
  entry: FaqEntry;
  section: FaqSection;
  topic: FaqTopic;
}>) {
  const path = faqEntryPath(entry);
  const related = relatedFaqEntries(collection.archive.entries, entry);
  const outline = faqDetailOutline(entry, related.length);
  const crumbs = [
    ...FAQ_BREADCRUMB_ROOT,
    { name: section.name, href: faqSectionPath(section.slug) },
    { name: topic.name, href: faqTopicPath(section.slug, topic.slug) },
    { name: entry.question, href: path },
  ];
  const faqJsonLd = faqPageJsonLd(path, [{ question: entry.question, answer: entry.answer }]);

  return (
    <FaqPageFrame
      pathname={path}
      crumbs={crumbs}
      jsonLd={[
        webPageJsonLd({ path, name: entry.question, description: entry.answer }),
        ...(faqJsonLd ? [faqJsonLd] : []),
      ]}
    >
      <div className="faq-layout">
        <article className="faq-detail faq-layout__main" data-content-article>
          <header className="faq-detail__header">
            <h2 className="faq-detail__title">{entry.question}</h2>
          </header>
          <section id={S.question.id} className="faq-question-card" aria-labelledby={faqDetailHeadingId(S.question)}>
            <div className="faq-question-card__header">
              <h3 id={faqDetailHeadingId(S.question)}>Q. {S.question.title}</h3>
              <span>
                {topic.name} · {entry.intent}
              </span>
            </div>
            <p>{entry.questionContext ?? entry.question}</p>
          </section>
          <section className="faq-answer-card">
            <div className="faq-answer-card__header">
              <FaqReviewer source={entry.copiedFrom} detail="질문 검토 및 답변 작성" />
              <span>{formatFaqAnswerDate(entry.reviewedAt ?? entry.updatedAt)}</span>
            </div>
            <div id={S.coreAnswer.id} className="faq-core-answer">
              <h3 id={faqDetailHeadingId(S.coreAnswer)}>{S.coreAnswer.title}</h3>
              <p>{entry.answer}</p>
            </div>
            {entry.bodyHtml && (
              <section id={S.detailedAnswer.id} className="faq-detailed-answer" aria-labelledby={faqDetailHeadingId(S.detailedAnswer)}>
                <h3 id={faqDetailHeadingId(S.detailedAnswer)}>{S.detailedAnswer.title}</h3>
                <div className="faq-richtext" dangerouslySetInnerHTML={{ __html: entry.bodyHtml }} />
              </section>
            )}
            {entry.clinicPerspectiveHtml && (
              <section id={S.clinicPerspective.id} className="faq-clinic-perspective" aria-labelledby={faqDetailHeadingId(S.clinicPerspective)}>
                <h3 id={faqDetailHeadingId(S.clinicPerspective)}>{entry.copiedFrom ? '원문 병원 관점' : S.clinicPerspective.title}</h3>
                <div className="faq-richtext" dangerouslySetInnerHTML={{ __html: entry.clinicPerspectiveHtml }} />
              </section>
            )}
            <FaqMedicalNote />
          </section>
          <ClinicGuide />
          {related.length > 0 && (
            <section id={S.relatedQuestions.id} className="faq-related" aria-labelledby={faqDetailHeadingId(S.relatedQuestions)}>
              <h3 id={faqDetailHeadingId(S.relatedQuestions)}>{S.relatedQuestions.title}</h3>
              <ul>
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={faqEntryPath(item)}>
                      <span>{item.question}</span>
                      <span aria-hidden="true">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
        <aside className="faq-sidebar" aria-label="답변 안내">
          <FaqSidebarBox title="이 답변의 구성">
            <nav aria-label="답변 구성 목차">
              <ol className="faq-sidebar-list">
                {outline.map((item) => (
                  <li key={item.key}>
                    <a href={`#${item.id}`}>
                      <span>{item.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </FaqSidebarBox>
          <FaqSidebarBox title="답변 작성">
            <FaqReviewer source={entry.copiedFrom} detail="답변 작성 및 최종 검수" />
          </FaqSidebarBox>
        </aside>
      </div>
    </FaqPageFrame>
  );
}
