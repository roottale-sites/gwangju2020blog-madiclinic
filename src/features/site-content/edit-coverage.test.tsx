import { renderToStaticMarkup } from 'react-dom/server';
import { parseDocument } from 'htmlparser2';
import { isTag } from 'domhandler';
import { coverageReport, parseVisualEditAddress } from '@roottale/cms-core/visual-edit';
import { expect, test } from 'vitest';
import contract from '../../../cms/site-content-contract.json';
import manifest from '../../../cms/content-import.json';
import exceptions from '../../../cms/edit-coverage-exceptions.json';
import { sharedModels } from './defaults';
import { record } from './bindings';
import { initialContent } from './fixtures';
import SharedContentPreview from './SharedContentPreview';

export function addressesIn(html: string) {
  const addresses: NonNullable<ReturnType<typeof parseVisualEditAddress>>[] = [];
  const walk = (node: ReturnType<typeof parseDocument>['children'][number]) => {
    if (isTag(node) && node.attribs['data-rt-edit']) {
      const address = parseVisualEditAddress(JSON.parse(node.attribs['data-rt-edit']));
      if (!address) throw new Error('잘못된 편집 주소'); addresses.push(address);
    }
    if ('children' in node) node.children.forEach(walk);
  };
  parseDocument(html).children.forEach(walk); return addresses;
}
test('계약의 모든 편집 칸이 실제 미리보기 클릭 대상과 일치한다', () => {
  const addresses = sharedModels.flatMap(model => addressesIn(renderToStaticMarkup(<SharedContentPreview modelKey={model.key} content={initialContent(model.key)} />)));
  const documents = manifest.entries.map(entry => ({ id: entry.id, templateKey: entry.templateKey, fields: entry.fields,
    fieldDefinitions: manifest.fieldGroups.find(group => group.location[0]?.[0]?.value === entry.modelKey)!.fields }));
  const report = coverageReport(contract, { addresses, documents, sections: [] }, exceptions);
  expect(report.missingFields).toEqual([]); expect(report.invalidAddresses).toEqual([]);
  expect(report.invalidExceptions).toEqual([]); expect(report.repeaterSegments).toBeGreaterThan(0);
});
test.each(sharedModels)('$label 미리보기는 해당 공개 컴포넌트만 그리고 alternateName을 표시하지 않는다', model => {
  const content = initialContent(model.key);
  const html = renderToStaticMarkup(<SharedContentPreview modelKey={model.key} content={content} />);
  expect(html.match(/class="clinic-guide"/g) ?? []).toHaveLength(model.key === 'clinic-common' ? 0 : 1);
  expect(html.match(/id="bottom"/g) ?? []).toHaveLength(model.key === 'clinic-common' ? 1 : 0);
  expect(html).not.toContain('alternateName'); expect(html).not.toContain('alternate_name');
});
test('숨긴 진료 안내는 미리보기와 클릭 목록에서도 숨긴다', () => {
  const content = initialContent('column-footer'); const doc = content.documents.find(doc => doc.modelKey === 'column-footer')!;
  doc.sectionStates.guide = 'hidden';
  const html = renderToStaticMarkup(<SharedContentPreview modelKey="column-footer" content={content} />);
  expect(html).not.toContain('class="clinic-guide"');
  expect(addressesIn(html).every(address => address.fieldKey.startsWith('field_footer__notice__'))).toBe(true);
});

test.each(sharedModels)('$label의 빈 값·조건부 버튼도 카드 아래 목록에서 다시 클릭할 수 있다', model => {
  const content = initialContent(model.key);
  const document = content.documents.find(doc => doc.modelKey === model.key)!;
  const empty = (value: unknown): unknown => Array.isArray(value) ? value.map(empty) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([key,item]) => [key, key === '_id' ? item : empty(item)])) : '';
  document.fields = empty(document.fields) as Record<string, unknown>;
  const html = renderToStaticMarkup(<SharedContentPreview modelKey={model.key} content={content} />);
  const documents = [{ id: document.id, templateKey: model.key, fields: document.fields, fieldDefinitions: manifest.fieldGroups.find(group => group.location[0]?.[0]?.value === model.key)!.fields }];
  const report = coverageReport({ visualEditing: { templates: contract.visualEditing.templates.filter(template => template.key === model.key) } }, { addresses: addressesIn(html), documents, sections: [] }, exceptions);
  expect(report.missingFields).toEqual([]); expect(report.invalidAddresses).toEqual([]);
  const remaining = html.match(/<dl class="site-content-fields">([\s\S]*?)<\/dl>/)?.[1];
  expect(remaining).toContain('비어 있음'); expect(remaining).not.toMatch(/<dt[^>]*data-rt-edit/);
  for (const dd of remaining!.matchAll(/<dd([^>]*)>/g)) expect(dd[1]).toContain('data-rt-edit=');
});

test('일부 반복행이나 앞 문구만 비워도 보이는 값은 아래 목록에 중복하지 않는다', () => {
  const content = initialContent('column-footer');
  const document = content.documents.find(doc => doc.modelKey === 'column-footer')!;
  const footer = document.fields.footer;
  if (!record(footer) || !record(footer.guide) || !record(footer.guide.clinic) || !record(footer.guide.labels)) throw new Error('fixture footer 누락');
  const hours = footer.guide.clinic.hours;
  if (!Array.isArray(hours) || !record(hours[0])) throw new Error('fixture hours 누락');
  hours[0].value = '';
  footer.guide.labels.phone = '';
  const html = renderToStaticMarkup(<SharedContentPreview modelKey="column-footer" content={content} />);
  const addresses = addressesIn(html);
  const hoursLabel = addresses.filter(address => address.fieldKey === 'field_footer__guide__clinic__hours__label');
  expect(hoursLabel).toHaveLength(4);
  expect(new Set(hoursLabel.map(address => address.path?.join('.'))).size).toBe(4);
  const remaining = html.match(/<dl class="site-content-fields">([\s\S]*?)<\/dl>/)![1]!;
  expect(addressesIn(remaining).some(address => address.fieldKey === 'field_footer__guide__labels__phone')).toBe(true);
});
