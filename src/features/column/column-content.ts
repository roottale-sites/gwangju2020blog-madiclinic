/**
 * 블로그(칼럼) 화면 문구·서식 단일 출처.
 *
 * headnerve `column-content.ts`에서 이관 JSON 88건 원장(`column-articles.json`)과
 * 질환 페이지 내부 링크 규칙(`DISEASE_LINK_RULES`)을 걷어낸 것이다. 이 저장소에는
 * 이관 콘텐츠도 질환 라우트도 없다(PLAN.md §5.2·§5.3). 분류는 코드에 두지 않고
 * CMS 공개 분류 API에서 읽는다(PLAN.md §4.2).
 */

/**
 * 메타 디스크립션 길이 상한.
 *
 * CMS의 `seo.description`과 발췌문이 같은 `<meta name="description">`을 채우므로
 * 상한도 하나여야 한다. 두 경로가 각자 숫자를 가지면 같은 사이트에서 길이가
 * 갈라지고, 그 차이는 배포 후 검색 결과에서야 드러난다.
 */
export const COLUMN_DESCRIPTION_MAX_LENGTH = 160;

/**
 * `/column` 목록 문구. `docs/metadata-table.md`의 확정값과 같아야 한다.
 *
 * `label`은 화면(서브 배너·h1·브레드크럼)에 쓰는 이름이고 GNB 5번째 메뉴의 하위
 * 항목 라벨과 같은 "블로그"다. `title`은 `<title>`에 그대로 들어가는 절대값이라
 * 레이아웃 template(`%s | 광주 남구 마디클리닉 블로그`)을 거치지 않는다.
 */
export const columnIndexMetadata = {
  label: '블로그',
  title: '블로그 | 광주 남구 마디클리닉',
  description:
    '광주 남구 마디클리닉 이경무 대표원장이 통증의 원인과 비수술 중점치료를 직접 씁니다. 영상유도하 통증중재시술 의료기관.',
} as const;

/**
 * 칼럼 글 공통 고지. 의료 정보 글이 치료 효과를 보장하는 것처럼 읽히지 않도록
 * 모든 상세 페이지에 붙인다(headnerve `columnMedicalDisclaimer`를 마디클리닉
 * 기준으로 고쳐 썼다).
 */
export const columnMedicalDisclaimer =
  '이 글은 환자 교육을 위한 정보 제공용 콘텐츠입니다. 개인의 상태에 따라 통증의 원인과 치료 경과는 다를 수 있으므로, 구체적인 진단과 치료는 의료진과 상담해 주세요.';

/** 상세 `<title>`. 레이아웃 template을 거치지 않는 절대값이다. */
export function columnSeoTitle(entry: Readonly<{ title: string }>): string {
  return `${entry.title} | ${columnIndexMetadata.title}`;
}

export function formatColumnDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);
}
