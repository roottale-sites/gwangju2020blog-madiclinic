/**
 * 광주 남구 마디클리닉 공개 사실 단일 출처.
 *
 * 값 출처: 사용자 제공 병원 정보(2026-09-30). 푸터·JSON-LD·진료 안내가
 * 모두 여기서 읽는다.
 */
export const clinic = {
  name: '광주 남구 마디클리닉',
  guideName: '마디의원',
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
    detail: '광주광역시 남구 독립로 14, 1~3층 (백운동)',
  },

  /** 상세 하단 진료 안내에 표시할 요일별 진료시간. */
  hours: [
    { label: '월·화·수', value: '09:00~19:00' },
    { label: '목요일', value: '09:00~13:00' },
    { label: '금요일', value: '09:00~18:00' },
    { label: '토요일', value: '09:00~13:00' },
  ],
  holidayNote: '일요일·공휴일 휴진',
  lunchNote: '평일 점심시간 13:00~14:00',
  directions: [
    {
      label: '버스',
      text: '백운우체국 정류장에서 하차하시면 됩니다. 마디의원은 광주 남구 백운동 백운우체국 옆, 독립로 14에 위치해 있습니다. 백운우체국 정류소 번호는 3093이며, 금남55·대촌70·대촌170·대촌171·마을715·매월06·송암68·송정99·수완12·순환01B·운림50·진월07·진월79·진월177 노선이 정차합니다.',
    },
    {
      label: '자가용',
      text: '네이버지도·카카오맵·차량 내비게이션에서 “광주 마디의원”을 검색해 주세요. 검색이 어려운 경우 “광주광역시 남구 독립로 14”를 목적지로 입력하시면 됩니다.',
    },
    {
      label: '위치',
      text: '광주광역시 남구 백운동, 백운우체국 옆에 위치한 마디의원 1~3층입니다.',
    },
    { label: '주차', text: '내원 환자 주차가 가능합니다.' },
  ],
  doctorPortrait: {
    src: '/madi/img/lee-kyungmoo.webp',
    width: 800,
    height: 1200,
    alt: '마디의원 이경무 대표원장',
  },

  /** 본 사이트 저작권 문구 그대로. */
  copyright: 'Copyright MADI Clinic. All rights reserved.',

  social: {
    naverBooking: 'https://m.booking.naver.com/booking/13/bizes/823238?theme=place&area=pll',
    cafe: 'https://cafe.naver.com/newzenserver',
    blog: 'https://blog.naver.com/gshj4938',
    naverTalk: 'https://talk.naver.com/ct/w4noyc?frm=mnmb&frm=nmb_detail#nafullscreen',
    kakao: 'https://pf.kakao.com/_YIYSxj',
    instagram: 'https://instagram.com/madiclinic2020',
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
