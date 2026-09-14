/**
 * 후기 화면 문구 단일 출처.
 *
 * headnerve는 이 문구를 라우트 안에 두었다. 목록·상세·RSS·사이트맵이 같은 이름을
 * 써야 하므로(GNB 하위 항목 라벨과도 같아야 한다) 한 곳으로 모았다.
 *
 * `<title>`은 레이아웃 template(`%s | 광주 남구 마디클리닉 블로그`)을 거치지 않는
 * 절대값이다. `docs/metadata-table.md`의 확정값과 같아야 한다.
 */
export const reviewsIndexMetadata = {
  /** 화면(서브 배너·h1·브레드크럼)과 GNB 하위 항목이 함께 쓰는 이름. */
  label: '후기',
  title: '후기 | 광주 남구 마디클리닉',
  description: '광주 남구 마디클리닉에서 치료받은 분들이 직접 남긴 치료 경험담입니다.',
} as const;

/** 상세 `<title>`. CMS가 SEO 제목을 비워 둘 때 쓰는 조립 규칙이다. */
export function reviewTitleWithSuffix(title: string): string {
  return `${title} | ${reviewsIndexMetadata.title}`;
}

/**
 * 치료경험담 고지.
 *
 * headnerve의 후기 안내 문구를 마디클리닉 기준으로 고쳐 썼다. 의료광고 심의
 * 문구(의료법 제57조 심의 대상 표기 여부)는 PLAN.md §8-3 미결이라 여기서 확정하지
 * 않는다. 확정되면 이 상수만 고친다.
 */
export const reviewDisclosure =
  '이 글은 환자 본인이 남긴 개인의 치료 경험입니다. 같은 치료를 받아도 증상의 원인·경과와 필요한 치료 기간은 개인마다 다를 수 있으며, 치료 효과를 보장하지 않습니다.';
