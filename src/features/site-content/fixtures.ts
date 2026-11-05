import manifest from '../../../cms/content-import.json';
import type { ContentDocument, SiteContent } from './bindings';
export function initialContent(previewKey?: string): SiteContent {
  const documents: ContentDocument[] = manifest.entries.map(entry => ({ id: entry.id, modelKey: entry.modelKey,
    fields: structuredClone(entry.fields), sectionStates: {}, version: '1' }));
  return { documents, previewId: documents.find(document => document.modelKey === previewKey)?.id };
}
