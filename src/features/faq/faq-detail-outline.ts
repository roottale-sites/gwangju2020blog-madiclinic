import type { FaqEntry } from './faq-model';

/**
 * FAQ 상세 화면의 본문 섹션 정의 — 본문 헤딩과 사이드바 "이 답변의 구성" 목차가
 * 이 한 곳에서 id·제목·표시 조건을 읽는다. 섹션을 추가·삭제·이름 변경할 때
 * 여기만 고치면 목차가 따라온다(`faq-detail-outline.test.tsx`의 계약 테스트가
 * 어긋남을 잡는다).
 *
 * headnerve와 다른 곳은 `clinicPerspective`의 제목뿐이다 — `cms/content-models.json`의
 * `clinic_perspective` 라벨("마디클리닉 관점")과 같은 문구여야 한다.
 */
export type FaqDetailSectionKey = 'question' | 'coreAnswer' | 'detailedAnswer' | 'clinicPerspective' | 'relatedQuestions';

export type FaqDetailSection = Readonly<{
  key: FaqDetailSectionKey;
  /** 본문 <section>의 id — 목차 앵커(#id)가 여기로 이동한다. */
  id: string;
  /** 본문 헤딩과 목차 항목이 함께 쓰는 제목. */
  title: string;
}>;

export const faqDetailSections: Readonly<Record<FaqDetailSectionKey, FaqDetailSection>> = {
  question: { key: 'question', id: 'question', title: '질문 내용' },
  coreAnswer: { key: 'coreAnswer', id: 'core-answer', title: '핵심 답변' },
  detailedAnswer: { key: 'detailedAnswer', id: 'detailed-answer', title: '상세 답변' },
  clinicPerspective: { key: 'clinicPerspective', id: 'clinic-perspective', title: '마디클리닉 관점' },
  relatedQuestions: { key: 'relatedQuestions', id: 'related-questions', title: '같이 많이 묻는 질문' },
};

/** 본문 헤딩(h3)의 id — aria-labelledby와 목차 앵커 대상 섹션을 잇는다. */
export function faqDetailHeadingId(section: FaqDetailSection): string {
  return `${section.id}-title`;
}

/**
 * 주어진 항목에서 실제로 렌더되는 섹션을 본문 순서대로 돌려준다.
 * 상세 답변·마디클리닉 관점은 내용이 있을 때만, 관련 질문은 1건 이상일 때만 나타난다.
 */
export function faqDetailOutline(
  entry: Pick<FaqEntry, 'bodyHtml' | 'clinicPerspectiveHtml'>,
  relatedCount: number,
): readonly FaqDetailSection[] {
  const s = faqDetailSections;
  return [
    s.question,
    s.coreAnswer,
    ...(entry.bodyHtml ? [s.detailedAnswer] : []),
    ...(entry.clinicPerspectiveHtml ? [s.clinicPerspective] : []),
    ...(relatedCount > 0 ? [s.relatedQuestions] : []),
  ];
}
