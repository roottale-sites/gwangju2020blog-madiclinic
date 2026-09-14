/**
 * 배포 origin 단일 출처.
 *
 * PLAN.md §5.2가 `https://gwangju2020blog.madiclinic.co.kr`를 운영 도메인으로
 * 정했다. canonical·JSON-LD·robots·사이트맵이 모두 이 값을 읽는다. 다른 호스트를
 * 쓰면 크롤러가 이 배포가 서비스하지 않는 주소로 간다.
 */
export const siteOrigin = 'https://gwangju2020blog.madiclinic.co.kr';

/** 사이트 상대 경로의 절대 URL. */
export function siteUrl(path: string): string {
  return new URL(path, siteOrigin).toString();
}
