export type ColumnTableOfContentsItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

export type ColumnDocument = {
  bodyHtml: string;
  tableOfContents: ColumnTableOfContentsItem[];
};

export type ColumnDocumentMode = 'annotated' | 'source-preserved';

const HEADING_PATTERN = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const ID_ATTRIBUTE_PATTERN = /\s+id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const SAFE_FRAGMENT_ID_PATTERN = /^[^\s"'<>#]+$/u;

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_entity, code: string) => {
      const radix = code.toLowerCase().startsWith('x') ? 16 : 10;
      const numeric = Number.parseInt(radix === 16 ? code.slice(1) : code, radix);
      return Number.isFinite(numeric) && numeric >= 0 && numeric <= 0x10ffff
        ? String.fromCodePoint(numeric)
        : '';
    })
    .replace(/&([a-z]+);/gi, (entity, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

function existingHeadingId(attributes: string): string | null {
  const match = ID_ATTRIBUTE_PATTERN.exec(attributes);
  const id = match?.[1] ?? match?.[2] ?? match?.[3];
  return id && SAFE_FRAGMENT_ID_PATTERN.test(id) ? id : null;
}

function nextHeadingId(usedIds: Set<string>, sequence: number): string {
  let candidate = `column-section-${sequence}`;
  let duplicate = 2;

  while (usedIds.has(candidate)) {
    candidate = `column-section-${sequence}-${duplicate}`;
    duplicate += 1;
  }

  return candidate;
}

/**
 * 살균을 마친 칼럼 HTML의 h2/h3만 목차 항목으로 승격한다.
 *
 * 기존의 안전하고 고유한 id는 보존해 원문 내부 링크를 깨지 않는다. id가 없거나
 * 중복된 제목만 예측 가능한 로컬 id를 받으므로 CMS와 이관 JSON이 같은 결과를 낸다.
 */
export function buildColumnDocument(
  bodyHtml: string,
  mode: ColumnDocumentMode = 'annotated',
): ColumnDocument {
  const usedIds = new Set<string>();
  const tableOfContents: ColumnTableOfContentsItem[] = [];
  let sequence = 0;

  const annotatedBodyHtml = bodyHtml.replace(
    HEADING_PATTERN,
    (heading, rawLevel: string, attributes: string, content: string) => {
      const label = decodeHtmlText(content);
      if (!label) return heading;

      sequence += 1;
      const preservedId = existingHeadingId(attributes);
      const id = preservedId && !usedIds.has(preservedId)
        ? preservedId
        : nextHeadingId(usedIds, sequence);

      usedIds.add(id);
      tableOfContents.push({
        id,
        label,
        level: Number(rawLevel) as 2 | 3,
      });

      if (mode === 'source-preserved' || preservedId === id) return heading;

      const attributesWithoutId = attributes.replace(ID_ATTRIBUTE_PATTERN, '');
      return `<h${rawLevel}${attributesWithoutId} id="${id}">${content}</h${rawLevel}>`;
    },
  );

  return {
    bodyHtml: mode === 'source-preserved' ? bodyHtml : annotatedBodyHtml,
    tableOfContents,
  };
}
