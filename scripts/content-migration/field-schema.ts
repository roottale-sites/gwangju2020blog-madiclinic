export type Field = { key: string; name: string; label: string; type: string; subFields?: Field[]; max?: number };
const labels: Record<string, string> = {
  shared: '공통 병원 정보', clinic: '병원 정보', physician: '의사 정보', alternate_name: 'alternateName', footer: '하단 안내', page_common: '페이지 공통 버튼·제목',
  guide: '진료 안내 카드', notice: '의료 고지', labels: '카드 표시 문구', title: '제목', body: '본문',
  guide_name: '안내 카드 병원 이름', representative: '대표원장 이름', representative_title: '대표원장 직함', business_number: '사업자등록번호', email: '이메일',
  phone_display: '화면 전화번호', fax_display: '팩스번호', address: '주소', line: '푸터 주소', detail: '상세 주소',
  hours: '진료시간', label: '표시 이름', value: '내용', holiday_note: '휴진 안내', lunch_note: '점심시간 안내', directions: '오시는 길', text: '설명', doctor_portrait: '원장 사진', alt: '사진 설명',
  copyright: '저작권', social: '외부 채널 주소', naver_booking: '네이버 예약 주소', cafe: '카페 질문 버튼', blog: '블로그', naver_talk: '네이버톡톡 주소', kakao: '카카오톡', instagram: '인스타그램 주소',
  schema: '검색 구조화 정보', street_address: '도로명 주소', address_locality: '구', address_region: '시·도', address_country: '국가 코드', description: '설명', available_service_names: '진료 항목', job_title: '의사 직함',
  business: '사업자번호 앞 문구', phone: '전화번호 앞 문구', fax: '팩스번호 앞 문구', question: '질문 버튼 문구', booking: '예약 버튼 문구', talk: '네이버톡톡 버튼 문구',
  preferred_source: '선호 출처 버튼 문구', previous: '이전글 버튼 문구', next: '다음글 버튼 문구', column_list: '블로그 목록 버튼 문구', reviews_list: '후기 목록 버튼 문구', related_reviews: '관련 후기 제목', all_reviews: '전체 후기 버튼 문구',
};
const socialLabels: Record<string, string> = { cafe: '네이버 카페 주소', blog: '네이버 블로그 주소', kakao: '카카오톡 채널 주소' };
export function definitions(value: Record<string, unknown>, path: string[] = []): Field[] {
  return Object.entries(value).filter(([key]) => key !== '_id').map(([name, item]) => {
    if (!labels[name]) throw new Error(`필드 이름 누락: ${name}`);
    const next = [...path, name];
    const label = path.at(-1) === 'social' ? (socialLabels[name] ?? labels[name])
      : path.join('.') === 'shared.footer' && name === 'representative' ? '원장 직함과 이름 사이 구분 문구'
      : labels[name];
    const field: Field = { key: `field_${next.join('__')}`, name, label, type: 'text' };
    if (Array.isArray(item)) return { ...field, type: 'repeater', max: 200, subFields: definitions(item[0], next) };
    if (item && typeof item === 'object') return { ...field, type: 'group', subFields: definitions(item as Record<string, unknown>, next) };
    return { ...field, type: typeof item === 'string' && item.length > 90 ? 'textarea' : 'text' };
  });
}
export function leafKeys(fields: readonly Field[]): string[] {
  return fields.flatMap(field => field.subFields ? leafKeys(field.subFields) : [field.key]);
}
