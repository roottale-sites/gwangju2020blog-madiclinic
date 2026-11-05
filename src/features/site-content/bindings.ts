import { clinicCommonVerification } from './verification';
import { visualEditAttributes } from '@roottale/cms-renderer-next/visual-edit';

export type ContentDocument = { id: string; modelKey: string; fields: Record<string, unknown>; version: string; sectionStates: Record<string, string> };
export type SiteContent = { documents: readonly ContentDocument[]; previewId?: string };
type Binding = { id: string; modelKey: string; preview: boolean; published: boolean; path: string[]; rowIds?: string[] };
const bindings = new WeakMap<object, Binding>();
export const snake = (name: string) => name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
export const fieldKey = (path: readonly string[]) => `field_${path.filter(part => !part.startsWith('@')).join('__')}`;
export function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function merge(original: unknown, value: unknown, binding?: Binding): unknown {
  if (Array.isArray(original)) {
    const rows = Array.isArray(value) ? value : original;
    const result = rows.map((row, index) => {
      const path = [...(binding?.path ?? []), `@${record(row) && typeof row._id === 'string' ? row._id : `fallback-${index}`}`];
      const fallback = original[index] ?? original[0];
      return merge(fallback, typeof fallback === 'string' && record(row) ? row.value : row, binding && { ...binding, path });
    });
    if (binding) bindings.set(result, { ...binding, rowIds: rows.map((row, index) => record(row) && typeof row._id === 'string' ? row._id : `fallback-${index}`) });
    return result;
  }
  if (record(original)) {
    const result: Record<string, unknown> = {};
    for (const [name, fallback] of Object.entries(original)) {
      const key = snake(name);
      result[name] = merge(fallback, record(value) ? value[key] : undefined, binding && { ...binding, path: [...binding.path, key] });
    }
    if (binding) bindings.set(result, binding);
    return result;
  }
  // 누락만 기본값. 저장된 빈칸·공백은 유지한다. 잘못된 타입은 공개 출력을 깨뜨리지 않는다.
  return typeof value === typeof original ? value : original;
}
export function bindGroup<T extends object>(content: SiteContent | undefined, modelKey: string, root: string, original: T): T {
  const document = content?.documents.find(item => item.modelKey === modelKey);
  return merge(original, document?.fields[root], document ? { id: document.id, modelKey, preview: content?.previewId === document.id, published: !content?.previewId, path: [root] } : undefined) as T;
}
export function contentAttributes(owner: unknown, key: string | number): Record<string, string> {
  const binding = owner && typeof owner === 'object' ? bindings.get(owner) : undefined;
  if (!binding?.preview) return {};
  const path = typeof key === 'number' ? [...binding.path, `@${binding.rowIds?.[key]}`, 'value'] : [...binding.path, snake(key)];
  const itemId = [...path].reverse().find(part => part.startsWith('@'))?.slice(1);
  return visualEditAttributes({ entityId: binding.id, fieldKey: fieldKey(path), path, ...(itemId ? { itemId } : {}) }, true);
}
/** 발행 문서가 존재할 때만 실제 공개 값에 확인 표식을 붙인다. */
export function verificationAttributes(owner: unknown, key: string): Record<string, string> {
  const binding = owner && typeof owner === 'object' ? bindings.get(owner) : undefined;
  if (!binding?.published || binding.modelKey !== 'clinic-common') return {};
  const field = clinicCommonVerification.fields.find(field => field.key === fieldKey([...binding.path, snake(key)]));
  return field ? { 'data-rt-shared-section': `${binding.modelKey}:${field.sectionKey}`, 'data-rt-field-check': `${binding.id}:${field.key}` } : {};
}
export function sectionVisible(content: SiteContent | undefined, modelKey: string, section: string): boolean {
  return (content?.documents.find(item => item.modelKey === modelKey)?.sectionStates[section] ?? 'visible') === 'visible';
}
export const present = (value: string) => !!value.trim();
export function safeContentHref(value: string): string | undefined {
  if (!value.trim() || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'tel:', 'mailto:'].includes(url.protocol) && !url.username && !url.password ? value : undefined;
  } catch { return undefined; }
}
