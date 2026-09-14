/**
 * 화면에 보이는 CMS 문자열의 문장부호를 정리한다.
 *
 * 긴 대시(`—`)는 사이트 문체에서 쓰지 않는다. HTML 본문·Tiptap 텍스트·목록과
 * 메타데이터가 같은 규칙을 따르게 이 경계에서 제거한다.
 */
export function removeEmDashes(value: string): string {
  return value.replaceAll('—', '');
}
