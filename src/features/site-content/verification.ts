/** 고정 목록 경로에서 실제 보이는 값만 발행 확인 대상으로 선언한다. */
export const clinicCommonVerification = {
  paths: ['/column'],
  fields: [
    ['business_number'], ['representative'], ['representative_title'], ['address', 'line'],
    ['phone_display'], ['fax_display'], ['email'], ['copyright'],
  ].map(path => ({
    key: `field_${['shared', 'clinic', ...path].join('__')}`, path: ['shared', 'clinic', ...path], sectionKey: 'clinic',
    normalization: ['phone_display', 'fax_display'].includes(path[0]!) ? 'phone' as const : 'text' as const,
  })),
};
