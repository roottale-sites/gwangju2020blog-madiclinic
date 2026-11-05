import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { modelDefaults, sharedModels } from '../../src/features/site-content/defaults';
import { snake } from '../../src/features/site-content/bindings';
import { clinicCommonVerification } from '../../src/features/site-content/verification';
import { definitions, leafKeys } from './field-schema';

const previous = await readFile('cms/content-import.json', 'utf8').then(JSON.parse).catch(() => ({ identityMap: {} }));
const identityMap: Record<string, string> = previous.identityMap;
function uuidv7() {
  const bytes = randomBytes(16);
  bytes.writeUIntBE(Date.now(), 0, 6); bytes[6] = (bytes[6]! & 15) | 112; bytes[8] = (bytes[8]! & 63) | 128;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const id = (key: string) => identityMap[key] ?? (identityMap[key] = uuidv7());
function encode(value: unknown, path: string): unknown {
  if (Array.isArray(value)) return value.map((item, index) => ({ _id: id(`${path}/${index}`), ...encode(typeof item === 'string' ? { value: item } : item, `${path}/${index}`) as object }));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [snake(key), encode(item, `${path}/${key}`)]));
  return value;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(Reflect.get(value, key))}`).join(',')}}`;
  return JSON.stringify(value);
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const contract = JSON.parse(await readFile('cms/site-content-contract.json', 'utf8'));
contract.version = 7;
contract.models = contract.models.filter((model: { modelKey: string }) => !sharedModels.some(shared => shared.key === model.modelKey));
contract.models.push(...sharedModels.map(model => ({ modelKey: model.key, preset: 'entity', templateKey: model.key, allowedQueryFields: [], shared: true,
  ...(model.key === 'clinic-common' ? { sharedFieldVerification: clinicCommonVerification } : {}) })));
const sourcePaths = ['src/data/clinic.ts', 'src/features/site-content/defaults.ts', 'src/features/column/column-content.ts', 'src/features/reviews/review-content.ts', 'src/features/faq/faq-content.ts'];
const files = await Promise.all(sourcePaths.map(async path => ({ path, sha256: hash(await readFile(path, 'utf8')) })));
const entries = sharedModels.map(model => {
  const fields = encode(modelDefaults(model.key), model.key) as Record<string, unknown>;
  return { id: id(`entry/${model.key}`), contractPageKey: null, modelKey: model.key, templateKey: model.key, path: null,
    title: model.label, slug: model.key, locale: 'ko', excerpt: '', seo: {}, fields,
    contentEditor: { sectionStates: {}, primaryTermId: null, cta: { mode: 'auto', targetPostId: null } },
    source: { files, valueSha256: hash(canonical(fields)) } };
});
const fieldGroups = entries.map(entry => ({ key: `group_${entry.modelKey.replaceAll('-', '_')}`, title: entry.title, source: 'code',
  location: [[{ param: 'model_key', operator: '==', value: entry.modelKey }, { param: 'post_template', operator: '==', value: entry.templateKey }]], fields: definitions(entry.fields) }));
contract.visualEditing = { previewPath: '/preview/content/:id', templateVersion: '1', templates: fieldGroups.map((group, index) => ({
  key: entries[index]!.templateKey, modelKey: entries[index]!.modelKey,
  sections: group.fields.flatMap(root => (root.subFields ?? []).map(field => ({ key: field.name.replaceAll('_','-'), label: field.label,
    fieldKeys: leafKeys([field]), allowHide: field.name === 'guide', allowDelete: false }))),
})) };
const configured = JSON.parse(await readFile('cms/content-models.json', 'utf8'));
configured.models = configured.models.filter((item: { model: { key: string } }) => !sharedModels.some(model => model.key === item.model.key));
configured.models.push(...sharedModels.map(model => ({ model: { key: model.key, label: model.label, cardinality: 'collection', preset: 'entity', source: 'site', state: 'active',
  presentation: { kind: 'data_only', listPaths: model.listPaths } }, fieldGroups: [], categories: [] })));
const models = configured.models.map((item: { model: unknown }) => item.model);
const commit = execFileSync('git', ['rev-parse','HEAD'], { encoding: 'utf8' }).trim();
await writeFile('cms/site-content-contract.json', JSON.stringify(contract, null, 2)+'\n');
await writeFile('cms/content-models.json', JSON.stringify(configured, null, 2)+'\n');
await writeFile('cms/content-import.json', JSON.stringify({ version: 1, source: { repository: 'gwangju2020blog-madiclinic', commit }, identityMap, contract, models, fieldGroups, entries, terms: [], references: [] }, null, 2)+'\n');
console.log(`공유 문서 ${entries.length}개, 편집 칸 ${fieldGroups.reduce((total, group) => total + leafKeys(group.fields).length, 0)}개 내보냄`);
