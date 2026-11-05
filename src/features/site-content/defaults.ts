import { clinic } from '../../data/clinic';
import { columnMedicalDisclaimer } from '../column/column-content';
import { reviewDisclosure } from '../reviews/review-content';
import { faqMedicalNote } from '../faq/faq-content';

const { doctorPortrait } = clinic;
export const guideLabels = {
  phone: '대표전화 : ', hours: '진료시간', question: '질문하기', booking: '예약하기',
  blog: '블로그', talk: '네이버톡톡', kakao: '카카오톡',
};
// 공통 푸터·JSON-LD·상세 공통 링크에서 실제 소비하는 값만 둔다.
const clinicFacts = {
  representative: clinic.representative, representativeTitle: clinic.representativeTitle,
  businessNumber: clinic.businessNumber, email: clinic.email,
  phoneDisplay: clinic.phoneDisplay, faxDisplay: clinic.faxDisplay,
  address: { line: clinic.address.line }, copyright: clinic.copyright,
  social: { naverBooking: clinic.social.naverBooking, cafe: clinic.social.cafe,
    blog: clinic.social.blog, kakao: clinic.social.kakao, instagram: clinic.social.instagram },
  schema: { address: clinic.schema.address, description: clinic.schema.description,
    availableServiceNames: clinic.schema.availableServiceNames,
    physician: { description: clinic.schema.physician.description } },
};
export const commonDefaults = {
  clinic: clinicFacts,
  physician: { alternateName: '' },
  footer: { business: '사업자등록번호 : ', representative: ' : ', phone: 'TEL / ', fax: 'FAX / ', email: 'EMAIL / ' },
  pageCommon: { cafe: '카페에 질문하기', previous: '이전글', next: '다음글', columnList: '블로그 목록', reviewsList: '후기 목록', relatedReviews: '다른 치료 경험', allReviews: '전체 후기 보기', preferredSource: '선호 출처로 추가' },
};
export const sharedModels = [
  { key: 'clinic-common', label: '공통 병원 안내', listPaths: ['/column', '/reviews', '/faq'] },
  { key: 'column-footer', label: '블로그 하단 안내', listPaths: ['/column'] },
  { key: 'reviews-footer', label: '후기 하단 안내', listPaths: ['/reviews'] },
  { key: 'faq-footer', label: 'FAQ 하단 안내', listPaths: ['/faq'] },
] as const;
export type SharedModelKey = typeof sharedModels[number]['key'];
export type FooterModelKey = Exclude<SharedModelKey, 'clinic-common'>;
export const footerDefaults = {
  'column-footer': { notice: { title: '의료 콘텐츠 안내', body: columnMedicalDisclaimer } },
  'reviews-footer': { notice: { title: '치료 경험담 안내', body: reviewDisclosure } },
  'faq-footer': { notice: faqMedicalNote },
};
// 하단에는 화면에서 쓰는 사실만 등록한다. 검색 전용·FAX·사업자 정보는 공통 문서 소유다.
export function guideDefaults() {
  const { guideName, representative, representativeTitle, phoneDisplay, address, hours, holidayNote, lunchNote, directions, social } = clinic;
  return { clinic: { guideName, representative, representativeTitle, phoneDisplay,
    address: { detail: address.detail }, hours, holidayNote, lunchNote, directions,
    doctorPortrait: { alt: doctorPortrait.alt },
    social: { cafe: social.cafe, naverBooking: social.naverBooking, blog: social.blog, naverTalk: social.naverTalk, kakao: social.kakao } }, labels: guideLabels };
}
export function modelDefaults(key: SharedModelKey) {
  return key === 'clinic-common' ? { shared: commonDefaults } : { footer: { guide: guideDefaults(), notice: footerDefaults[key].notice } };
}
