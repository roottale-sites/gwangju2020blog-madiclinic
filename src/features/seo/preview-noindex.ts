import { siteOrigin } from '../../data/site';

/**
 * 운영 origin이 아닌 모든 요청 호스트를 Preview/임시 주소로 본다.
 *
 * 배포 별칭은 Vercel과 테넌트 설정에서 언제든 바뀔 수 있다. 특정 별칭을 코드에
 * 열거하지 않고, 절대 URL의 단일 원장인 `siteOrigin`과 요청 호스트를 비교한다.
 */
const operatingHostname = new URL(siteOrigin).hostname;
const wwwOperatingHostname = `www.${operatingHostname}`;

export function isNonCanonicalHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  return normalizedHostname !== operatingHostname && normalizedHostname !== wwwOperatingHostname;
}
