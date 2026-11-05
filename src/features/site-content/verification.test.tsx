import { renderToStaticMarkup as render } from 'react-dom/server';
import { parseDocument } from 'htmlparser2';
import { isTag, isText, type ChildNode } from 'domhandler';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import contract from '../../../cms/site-content-contract.json';
import MadiFooter from '../../components/madi/MadiFooter';
import SharedContentPreview from './SharedContentPreview';
import { initialContent } from './fixtures';
import { record, type SiteContent } from './bindings';

const config = contract.models.find(model => model.modelKey === 'clinic-common')!.sharedFieldVerification!;
const hash = (value: string, normalization: string) => createHash('sha256').update(normalization === 'phone'
  ? value.replace(/[\s().-]/g, '') : value.normalize('NFC').replace(/\s+/g, ' ').trim()).digest('hex');

// 플랫폼 shared-field-html.ts의 compareSharedFields와 동일한 공개 HTML 판독 규칙.
function compareSharedFields(html: string, content: SiteContent) {
  const document = content.documents.find(doc => doc.modelKey === 'clinic-common')!;
  const actual = new Map<string, string[]>();
  function visit(node: ChildNode, parentSection?: string): string {
    if (isText(node)) return node.data;
    if (!('children' in node)) return '';
    let section = parentSection;
    let field: string | undefined;
    if (isTag(node)) {
      const attrs = node.attribs;
      if (['script','style','template','noscript'].includes(node.name) || attrs.hidden !== undefined || attrs['aria-hidden'] === 'true') return '';
      section = attrs['data-rt-shared-section'] ?? parentSection;
      field = attrs['data-rt-field-check'];
    }
    const text = node.children.map(child => visit(child, section)).join('');
    if (field !== undefined && section !== undefined) {
      const key = JSON.stringify([section, field]);
      actual.set(key, [...actual.get(key) ?? [], text]);
    }
    return text;
  }
  parseDocument(html).children.forEach(node => visit(node));
  return config.fields.flatMap(field => {
    let value: unknown = document.fields;
    for (const key of field.path) value = record(value) ? value[key] : undefined;
    const matches = actual.get(JSON.stringify([`clinic-common:${field.sectionKey}`, `${document.id}:${field.key}`])) ?? [];
    return typeof value === 'string' && matches.length && matches.every(text => hash(text, field.normalization) === hash(value, field.normalization)) ? [] : [field.key];
  });
}

test('발행 확인은 /column 푸터의 값 8개만 선언하고 실제 HTML 텍스트와 일치한다', () => {
  expect(config.paths).toEqual(['/column']);
  expect(config.fields.map(field => field.path.slice(2).join('.'))).toEqual([
    'business_number','representative','representative_title','address.line','phone_display','fax_display','email','copyright',
  ]);
  expect(config.fields.filter(field => field.normalization === 'phone').map(field => field.path.at(-1))).toEqual(['phone_display','fax_display']);
  for (const model of contract.models.filter(model => model.modelKey.endsWith('-footer'))) expect(model.sharedFieldVerification).toBeUndefined();
  const content = initialContent();
  const html = render(<MadiFooter content={content} />);
  expect(compareSharedFields(html, content)).toEqual([]);
  expect(html.match(/data-rt-field-check=/g)).toHaveLength(8);
  expect(render(<MadiFooter />)).not.toContain('data-rt-');
  expect(render(<SharedContentPreview modelKey="clinic-common" content={initialContent('clinic-common')} />)).not.toContain('data-rt-field-check');
});

test('수정된 공개 값과 전화 형식을 비교하고 라벨 혼입·오래된 복사본·숨긴 표식을 거부한다', () => {
  const content = initialContent();
  const shared = content.documents[0]!.fields.shared;
  if (!record(shared) || !record(shared.clinic)) throw new Error('fixture clinic 누락');
  shared.clinic.phone_display = '02-1234-5678';
  shared.clinic.representative = '시험 <원장> & 동료';
  const html = render(<MadiFooter content={content} />);
  expect(compareSharedFields(html, content)).toEqual([]);
  expect(compareSharedFields(html.replace('02-1234-5678', '(02) 1234.5678'), content)).toEqual([]);
  const phoneKey = config.fields.find(field => field.normalization === 'phone')!.key;
  expect(compareSharedFields(html.replace('02-1234-5678', 'TEL / 02-1234-5678'), content)).toContain(phoneKey);
  expect(compareSharedFields(html + html.replace('02-1234-5678', '062-000-0000'), content)).toContain(phoneKey);
  expect(compareSharedFields(`<div hidden>${html}</div>`, content)).toHaveLength(8);
  expect(compareSharedFields(`<script>${html}</script>`, content)).toHaveLength(8);
  expect(compareSharedFields(html.replace('02-1234-5678', '02-1234-5678<span aria-hidden="true">장식</span>'), content)).toEqual([]);
});
