/**
 * 자주 묻는 질문 화면 문구 단일 출처.
 *
 * headnerve는 이 문구를 화면 컴포넌트와 라우트에 나눠 적었다. 이 저장소는 칼럼
 * (`column-content.ts`)·후기(`review-content.ts`)와 같이 한 곳에 모은다 — 목록·
 * 상세·사이트맵·메타데이터가 같은 이름을 써야 하고, 그 이름은 GNB 하위 항목
 * (`data/nav.ts`의 `자주 묻는 질문`)과도 같아야 한다.
 *
 * `<title>`은 레이아웃 template(`%s | 광주 남구 마디클리닉 블로그`)을 거치지 않는
 * 절대값이다. `docs/metadata-table.md`의 확정값과 같아야 한다.
 */
export const faqIndexMetadata = {
  /** 화면(서브 배너·본문 제목·브레드크럼)과 GNB 하위 항목이 함께 쓰는 이름. */
  label: '자주 묻는 질문',
  title: '자주 묻는 질문 | 광주 남구 마디클리닉',
  description:
    '광주 남구 마디클리닉 이경무 대표원장이 진료실에서 자주 받는 질문에 답합니다. 통증의 원인과 검사, 비수술 중점치료와 경과를 확인하세요.',
} as const;

/** 하위 단계 `<title>`. 레이아웃 template을 거치지 않는 절대값이다. */
export function faqTitleWithSuffix(title: string): string {
  return `${title} | ${faqIndexMetadata.title}`;
}

/** 메타 디스크립션 길이 상한. 분류 설명과 답변이 같은 자리를 채우므로 상한도 하나다. */
export const FAQ_DESCRIPTION_MAX_LENGTH = 160;

export function faqDescription(value: string): string {
  const text = value.replace(/\s+/gu, ' ').trim();
  if (!text) return faqIndexMetadata.description;
  return text.length > FAQ_DESCRIPTION_MAX_LENGTH
    ? `${text.slice(0, FAQ_DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`
    : text;
}

/**
 * 분류에 SEO 문구가 없을 때 쓰는 조립 규칙.
 *
 * 코드에 분류 slug·이름을 두지 않는다(PLAN.md §4.2). 이름은 CMS에서 온 값이고
 * 여기서는 그 이름을 끼우는 서식만 소유한다.
 */
export function faqSectionFallbackDescription(name: string): string {
  return `${name}에 관해 진료실에서 자주 받는 질문과 답변입니다.`;
}

export function faqTopicFallbackDescription(name: string): string {
  return `${name}의 증상·검사·치료와 경과에 관해 자주 묻는 질문입니다.`;
}

export function faqSectionPageTitle(name: string): string {
  return `${name} 자주 묻는 질문`;
}

/**
 * CMS를 읽을 수 없거나 아직 아무것도 발행되지 않은 상태의 안내.
 *
 * headnerve는 이 자리에서 질환 페이지의 검수 FAQ 71건(정적 초기 원장)을 대신
 * 보여 줬다. 이 저장소에는 폴백 콘텐츠가 없으므로(PLAN.md §5.3) 이유를 밝힌다 —
 * 사용자에게 "질문이 없다"와 "지금 불러올 수 없다"는 다른 사실이다.
 */
export const faqNotices = {
  unconfigured: '자주 묻는 질문을 준비 중입니다. 곧 질문과 답변을 올릴 예정입니다.',
  'no-model': '자주 묻는 질문을 준비 중입니다. 질문 콘텐츠 유형이 아직 연결되지 않았습니다.',
  upstream: '지금은 질문 목록을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.',
  emptySections: '아직 공개된 진료 영역이 없습니다. 질문이 올라오면 이 화면에서 바로 보입니다.',
  emptyTopics: '이 진료 영역에는 아직 공개된 세부 질환이 없습니다.',
  emptyEntries: '현재 공개된 질문이 없습니다.',
  emptyIntent: '이 분류에 공개된 질문이 없습니다.',
} as const;

/** 상세 답변 위의 의료 정보 고지. 칼럼·후기의 고지와 같은 자리를 지킨다. */
export const faqMedicalNote = {
  title: '읽기 전 확인해 주세요',
  body: '이 답변은 일반적인 건강 정보이며 개인의 진단을 대신하지 않습니다. 통증의 원인과 치료 선택은 진료를 통해 확인해 주세요.',
} as const;

export function formatFaqAnswerDate(value: string): string {
  return `답변일 ${value.slice(0, 10).replaceAll('-', '. ')}.`;
}
