import { renderToStaticMarkup as render } from 'react-dom/server';
import { expect, test } from 'vitest';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import { contentEntityJsonLd } from '../seo/schema';
import { phoneFromDisplay } from './phone';
import { initialContent } from './fixtures';
import { record } from './bindings';

test.each([
  ['062-675-0750', 'tel:0626750750', '+82-62-675-0750'],
  ['02-1234-5678', 'tel:0212345678', '+82-2-1234-5678'],
  ['010-1234-5678', 'tel:01012345678', '+82-10-1234-5678'],
])('표시 번호 %s에서 전화 링크와 국가번호를 계산한다', (value, href, e164) => {
  expect(phoneFromDisplay(value)).toEqual({ href, e164 });
});
test.each(['', '   ', '전화 문의', '062-675-0750 ext 1', '+82-62-675-0750', '062-675-075', 'tel:0626750750'])('잘못된 번호 %s는 전화 링크와 telephone을 생략한다', value => {
  expect(phoneFromDisplay(value)).toBeUndefined();
  const content = initialContent();
  for (const document of content.documents) {
    const root = document.fields[document.modelKey === 'clinic-common' ? 'shared' : 'footer'];
    if (!record(root)) throw new Error('fixture 루트 누락');
    const guide = document.modelKey === 'clinic-common' ? root : root.guide;
    if (!record(guide) || !record(guide.clinic)) throw new Error('fixture clinic 누락');
    guide.clinic.phone_display = value;
  }
  for (const modelKey of ['column-footer','reviews-footer','faq-footer'] as const) expect(render(<ClinicGuide modelKey={modelKey} content={content} />)).not.toContain('href="tel:');
  expect(contentEntityJsonLd(content).find(node => node['@type'] === 'MedicalClinic')).not.toHaveProperty('telephone');
});
test('표시 번호와 원장 직함의 변경을 같은 문서에서 계산한다', () => {
  const content = initialContent();
  const shared = content.documents[0]!.fields.shared;
  if (!record(shared) || !record(shared.clinic)) throw new Error('fixture clinic 누락');
  shared.clinic.phone_display = '02-1234-5678'; shared.clinic.representative_title = '진료원장';
  const graph = contentEntityJsonLd(content);
  expect(graph.find(node => node['@type'] === 'MedicalClinic')?.telephone).toBe('+82-2-1234-5678');
  expect(graph.find(node => node['@type'] === 'Person')?.jobTitle).toBe('진료원장');
  const footer = content.documents.find(doc => doc.modelKey === 'column-footer')!.fields.footer;
  if (!record(footer) || !record(footer.guide) || !record(footer.guide.clinic)) throw new Error('fixture 하단 누락');
  footer.guide.clinic.phone_display = '010-1234-5678';
  const html = render(<ClinicGuide content={content} />);
  expect(html).toContain('href="tel:01012345678"'); expect(html).toContain('010-1234-5678');
});
