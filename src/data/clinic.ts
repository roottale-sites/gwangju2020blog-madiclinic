/**
 * 광주 남구 마디클리닉 공개 사실 단일 출처.
 *
 * 값 출처: PLAN.md §5.2와 본 사이트 푸터(`http://gwangju2020.madiclinic.co.kr`
 * `#bottom`). 푸터·JSON-LD·진료 안내가 모두 여기서 읽는다.
 */
export const clinic = {
  name: '광주 남구 마디클리닉',
  nameEn: 'Gwangju Dr.Lee MADI Clinic',
  /** 본 사이트 헤더 로고와 푸터 로고의 alt. */
  logoAlt: '광주 남구 마디클리닉',
  representative: '이경무',
  representativeTitle: '대표원장',
  businessNumber: '322-91-01246',
  email: 'madi2020@naver.com',

  phoneDisplay: '062-675-0750',
  phoneTel: '0626750750',
  phoneE164: '+82-62-675-0750',
  faxDisplay: '062-675-0760',

  address: {
    /** 푸터 한 줄 표기. 본 사이트와 같은 문구. */
    line: '광주광역시 남구 독립로 14 1~3F',
  },

  /**
   * 진료시간. 본 사이트 `/clinic/clinic01.html`(2026-09-15 확인) 값이다.
   * 상세 하단 진료 안내 박스가 읽는다.
   */
  hours: [
    { label: '평일', value: '09:00 ~ 19:00 (금요일 18:00)' },
    { label: '목요일 · 토요일', value: '09:00 ~ 13:00' },
    { label: '점심시간', value: '13:00 ~ 14:00' },
  ],
  holidayNote: '일요일 및 공휴일은 휴진합니다.',
  /** 예약제 운영 안내. 본 사이트 진료 안내 문구를 줄여 쓴다. */
  bookingNote: '효과적인 치료를 위해 예약제로 운영합니다. 전화 또는 네이버로 예약 후 내원해 주세요.',

  /** 본 사이트 저작권 문구 그대로. */
  copyright: 'Copyright MADI Clinic. All rights reserved.',

  social: {
    naverBooking: 'https://m.booking.naver.com/booking/13/bizes/823238',
    kakao: 'http://pf.kakao.com/_YIYSxj',
    instagram: 'https://instagram.com/madiclinic2020',
    youtube: 'https://youtube.com/@practicalpainmanagementwit8115',
  },

  schema: {
    address: {
      streetAddress: '독립로 14, 1~3층',
      addressLocality: '남구',
      addressRegion: '광주광역시',
      addressCountry: 'KR',
    },
    description:
      '영상유도하 통증중재시술 의료기관. 인대증식술·ESWT·신경차단술·도수치료·IVNT 등 비수술 중점치료.',
    availableServiceNames: [
      '인대증식술',
      'ESWT(체외충격파치료)',
      '신경차단술',
      '도수치료',
      'IVNT(신경치료주사)',
    ],
    physician: {
      jobTitle: '대표원장',
      description: '영상유도하 통증중재시술',
    },
  },
} as const;
