import { clinic } from '../../data/clinic';
import { mainSiteOrigin } from '../../data/nav';

/**
 * 원장 프로필은 본 사이트가 단일 출처다. 목록·후기에서 원장 이름을 누르면 본
 * 사이트 프로필 페이지로 보낸다(이 저장소에는 `/about`이 없다).
 */
export const DOCTOR_PROFILE_HREF = `${mainSiteOrigin}/doctor/doctor02.html`;

/**
 * 목록에 적힌 담당자 이름이 대표원장인지 판정한다.
 * CMS 값은 '이경무'·'이경무 원장'처럼 섞여 들어온다.
 */
export function isRepresentativeDoctor(name: string): boolean {
  return name.replace(/\s+/g, '').startsWith(clinic.representative);
}
