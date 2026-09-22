export type ContentSource = { name: string; url: string };

export function contentSource(metaJson: Record<string, unknown>): ContentSource | undefined {
  const source = metaJson.copiedFrom;
  if (!source || typeof source !== 'object') return undefined;
  const name = Reflect.get(source, 'name');
  const url = Reflect.get(source, 'url');
  if (typeof name !== 'string' || !name.trim() || typeof url !== 'string') return undefined;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    return { name: name.trim(), url: parsed.href };
  } catch {
    return undefined;
  }
}
