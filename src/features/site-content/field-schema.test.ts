import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import manifest from '../../../cms/content-import.json';
import contract from '../../../cms/site-content-contract.json';
import receipt from '../../../cms/content-runtime-receipt.json';
import { definitions, leafKeys } from '../../../scripts/content-migration/field-schema';

test('공유 필드 원문·계약·관리자 양식이 같은 스키마를 사용한다', () => {
  expect(contract.version).toBe(7); expect(contract.pages).toEqual([]);
  expect(manifest.contract).toEqual(contract);
  for (const [index, entry] of manifest.entries.entries()) {
    const fields = definitions(entry.fields); expect(fields).toEqual(manifest.fieldGroups[index]!.fields);
    const keys = contract.visualEditing.templates[index]!.sections.flatMap(section => section.fieldKeys);
    expect(keys.sort()).toEqual(leafKeys(fields).sort());
    expect(keys.some(key => /__(name_en|logo_alt)$/.test(key))).toBe(false);
    for (const file of entry.source.files) expect(createHash('sha256').update(readFileSync(file.path)).digest('hex')).toBe(file.sha256);
    const notice = contract.visualEditing.templates[index]!.sections.find(section => section.key === 'notice');
    if (notice) { expect(notice.allowHide).toBe(false); expect(notice.allowDelete).toBe(false); }
  }
  const fields = manifest.fieldGroups[0]!.fields[0]!.subFields!;
  const physician = fields.find(field => field.name === 'physician')!;
  expect(physician.subFields![0]!.label).toBe('alternateName');
  expect(manifest.entries[0]!.fields.shared!.physician.alternate_name).toBe('');
  expect(receipt.templateVersion).toBe(contract.visualEditing.templateVersion);
});
test('공통 안내와 각 하단의 관리자 목록 위치를 보존한다', () => {
  for (const entry of manifest.entries) {
    const model = manifest.models.find(model => model.key === entry.modelKey)!;
    expect(model.presentation.kind).toBe('data_only');
    expect('listPaths' in model.presentation ? model.presentation.listPaths : []).toEqual(entry.modelKey === 'clinic-common' ? ['/column','/reviews','/faq'] : [`/${entry.modelKey.replace('-footer','')}`]);
  }
  expect(contract.fixedPatterns.map(pattern => pattern.key)).toContain('column-footer-image');
  expect(contract.exposureSlots.map(slot => slot.key)).toContain('site-popup');
  expect('patternManagement' in contract ? contract.patternManagement : undefined).not.toBe('code');
});
