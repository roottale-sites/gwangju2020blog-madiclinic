import { renderToStaticMarkup as render } from 'react-dom/server';
import { expect, test } from 'vitest';
import MadiFooter from '../../components/madi/MadiFooter';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import { FaqMedicalNote } from '../faq/FaqShared';
import MedicalNotice from './MedicalNotice';
import baseline from './public-baseline.json';
import { initialContent } from './fixtures';
import { record, safeContentHref, type SiteContent } from './bindings';
import { contentEntityJsonLd } from '../seo/schema';
import { footerDefaults } from './defaults';

function fields(content: SiteContent, model: string, path: string[]) {
  let result: unknown = content.documents.find(document => document.modelKey === model)!.fields;
  for (const key of path) { if (!record(result)) throw new Error('fixture 경로 오류'); result = result[key]; }
  if (!record(result)) throw new Error('fixture 객체 아님');
  return result;
}
test.each([undefined, initialContent()])('문서 누락과 초기 문서 모두 기존 공개 HTML을 그대로 유지한다', content => {
  const footer = render(<MadiFooter content={content} />);
  // 발행 문서는 값 표식만 추가한다. 문서가 없을 때는 원 HTML을 직접 대조한다.
  const withoutVerification = footer.replace(/<span data-rt-shared-section="[^"]*" data-rt-field-check="[^"]*">([\s\S]*?)<\/span>/g, '$1')
    .replace(/ data-rt-(?:shared-section|field-check)="[^"]*"/g, '');
  expect(content ? withoutVerification : footer).toBe(baseline.footer);
  expect(render(<ClinicGuide content={content} />)).toBe(baseline.guide);
  expect(render(<FaqMedicalNote content={content} />)).toBe(baseline.faq);
  expect(contentEntityJsonLd(content)).toEqual(contentEntityJsonLd());
  for (const modelKey of ['reviews-footer','faq-footer'] as const) expect(render(<ClinicGuide content={content} modelKey={modelKey} />)).toBe(baseline.guide);
});
test('키별 기본값을 쓰면서 저장된 빈 값과 공백은 줄·버튼을 숨긴다', () => {
  const content = initialContent();
  const common = fields(content,'clinic-common',['shared','clinic']);
  common.email = '  '; delete common.fax_display;
  const footer = fields(content,'column-footer',['footer','guide']);
  const clinic = fields(content,'column-footer',['footer','guide','clinic']);
  clinic.holiday_note = ''; clinic.lunch_note = '  ';
  const labels = fields(content,'column-footer',['footer','guide','labels']); labels.booking = ' ';
  expect(footer).toBeDefined();
  const html = render(<ClinicGuide content={content} />);
  expect(html).not.toContain('clinic-guide__holiday'); expect(html).not.toContain('clinic-guide__lunch');
  expect(html).not.toContain('clinic-guide__booking'); expect(html).toContain('마디의원');
  const footerHtml = render(<MadiFooter content={content} />);
  expect(footerHtml).not.toContain('EMAIL /'); expect(footerHtml).toContain('062-675-0760');
});
test('각 하단 문서의 값·섹션 숨김은 다른 모델에 영향을 주지 않는다', () => {
  const content = initialContent();
  fields(content,'column-footer',['footer','guide','clinic']).guide_name = '블로그 전용';
  content.documents.find(document => document.modelKey === 'reviews-footer')!.sectionStates.guide = 'hidden';
  expect(render(<ClinicGuide content={content} />)).toContain('블로그 전용');
  expect(render(<ClinicGuide content={content} modelKey="faq-footer" />)).toContain('마디의원');
  expect(render(<ClinicGuide content={content} modelKey="reviews-footer" />)).toBe('');
});
test.each(['javascript:alert(1)','data:text/html,test','http://example.test','//example.test','https://name:secret@example.test','https://example.test\\evil','/\\evil','https://example.test\n'])('위험한 주소를 거부한다: %s', value => {
  expect(safeContentHref(value)).toBeUndefined();
  const content = initialContent(); fields(content,'column-footer',['footer','guide','clinic','social']).cafe = value;
  expect(render(<ClinicGuide content={content} />)).not.toContain('clinic-guide__question');
});
test.each(['https://example.test/path','/column','tel:0626750750','mailto:hello@example.test'])('허용 주소를 보존한다: %s', value => expect(safeContentHref(value)).toBe(value));
test.each(['column-footer','reviews-footer','faq-footer'] as const)('의료 고지 %s는 비우거나 숨겨도 원문을 유지한다', modelKey => {
  const content = initialContent(); const notice = fields(content,modelKey,['footer','notice']); notice.title = ''; notice.body = '  ';
  content.documents.find(document => document.modelKey === modelKey)!.sectionStates.notice = 'hidden';
  const html = render(<MedicalNotice modelKey={modelKey} content={content} />);
  expect(html).toContain(footerDefaults[modelKey].notice.title); expect(html).toContain(footerDefaults[modelKey].notice.body);
});
test('의사 alternateName은 입력값이 있을 때 구조화 데이터에만 나오며 타입·사이트 이름은 고정한다', () => {
  const content = initialContent(); fields(content,'clinic-common',['shared','physician']).alternate_name = '시험 활동명';
  fields(content,'clinic-common',['shared','clinic']).representative = '시험 원장';
  const graph = contentEntityJsonLd(content); const physician = graph.find(node => node['@type'] === 'Person');
  expect(physician?.alternateName).toBe('시험 활동명'); expect(physician?.name).toBe('시험 원장');
  expect(graph.find(node => node['@type'] === 'MedicalClinic')?.name).toBe('광주 남구 마디클리닉');
  expect(render(<MadiFooter content={content} />)).not.toContain('시험 활동명');
});
test('공개 출력에는 편집 주소가 없다', () => {
  const content = initialContent();
  expect(render(<MadiFooter content={content} />)+render(<ClinicGuide content={content} />)).not.toContain('data-rt-edit');
});
