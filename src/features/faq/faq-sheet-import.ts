/**
 * `마디클리닉 FAQ` Google Sheets(`FAQ 입력` 탭) → ROOT-ADMIN FAQ 초안 계획.
 *
 * headnerve `features/faq/faq-sheet-import.ts`를 옮긴 것이다. 계산은 그대로이고
 * 문구(시트 이름·`관점` 열 별칭)만 마디클리닉 기준이다.
 *
 * 시트는 작성 원장이고 CMS가 발행 원장이다. 이 모듈은 CSV 텍스트를 읽어
 * 분류·slug·본문·관련 질문을 계산하는 순수 계획만 만든다 — 네트워크·쓰기는
 * `scripts/import-faq-sheet.ts`가 맡는다.
 *
 * 규칙
 * - 영역·질환은 CMS 분류 이름(또는 slug)으로 맞춘다. 못 찾으면 그 행은 오류.
 * - `주소(선택)` 열이 있으면 그 slug를 쓰고, 없으면 질문에서 한글 slug를 만든다.
 *   내부 링크 키(`faq.영역.질환.slug`)가 이 slug에 묶이므로 dry-run이 파생 slug를
 *   경고로 보여 준다.
 * - 상세 답변 HTML은 문단·제목·목록·강조·링크만 있으면 Tiptap 문서로 바꾸고,
 *   그 밖의 태그가 있으면 ROOT-ADMIN `HTML 입력`과 같은 `importedHtml` 블록으로
 *   원문을 보존한다.
 * - 상세 답변 끝의 "같이 많이 묻는 질문" 목록과 `관련 질문(선택)` 열은 같은 시트의
 *   질문이나 CMS FAQ 제목과 맞춰 `[[internal:faq.…|질문]]` 토큰·예약 키로 바꾼다.
 *   못 맞춘 질문은 문구만 남기고 경고한다.
 * - 이미 CMS에 같은 slug 글이 있으면 건드리지 않는다(추가 전용).
 */
import { parseDocument } from 'htmlparser2';
import type { ChildNode, Element } from 'domhandler';

import { cleanFaqQuestion, faqQuestionSlug } from './faq-model';
import type { FaqWireCategory } from './faq-wire';

export type FaqSheetRow = {
  rowNumber: number;
  section: string;
  topic: string;
  question: string;
  summary: string;
  detailHtml: string;
  perspective: string;
  publishedOn: string;
  slug: string;
  relatedQuestions: readonly string[];
};

export type FaqSheetSeed = {
  rowNumber: number;
  slug: string;
  slugDerived: boolean;
  title: string;
  excerpt: string;
  bodyJson: Record<string, unknown>;
  bodyMode: 'tiptap' | 'importedHtml' | 'empty';
  categoryId: string;
  categoryPath: readonly [string, string];
  key: string;
  publishedOn: string;
  fieldValues: Record<string, unknown>;
  relatedContentKeys: readonly string[];
  warnings: readonly string[];
};

export type ExistingFaqPost = {
  id: string;
  slug: string;
  title: string;
  status: string;
  categoryIds: readonly string[];
};

export type FaqSheetImportPlan = {
  create: readonly FaqSheetSeed[];
  keep: readonly { seed: FaqSheetSeed; post: ExistingFaqPost }[];
  errors: readonly string[];
  warnings: readonly string[];
};

/** `faqInternalLinkKey`와 같은 형식 — CMS 분류가 원장이라 정적 영역 목록에 묶지 않는다. */
export function faqSheetLinkKey(sectionSlug: string, topicSlug: string, slug: string): string {
  return `faq.${sectionSlug}.${topicSlug}.${slug}`.toLowerCase();
}

const RELATED_HEADING_PATTERN = /같이\s*많이\s*묻는\s*질문|함께\s*보면\s*좋은\s*질문|관련\s*질문/u;
const MAX_RELATED_KEYS = 5;

// ---------------------------------------------------------------- CSV

/** RFC 4180 CSV — 따옴표 안 줄바꿈·이중 따옴표를 지원한다. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/u, '');
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
}

function normalizeHeader(value: string): string {
  return value
    .replace(/\([^)]*\)/gu, '')
    .replace(/[\s·・:：]/gu, '')
    .toLowerCase();
}

const HEADER_ALIASES = {
  section: ['영역', 'section'],
  topic: ['질환', 'topic'],
  question: ['질문', 'question', '제목'],
  summary: ['요약답변', '요약', 'summary', 'excerpt'],
  detailHtml: ['상세답변', '상세', 'body', 'detail'],
  perspective: ['관점', '마디클리닉관점', 'perspective'],
  publishedOn: ['발행일', 'publishedon', 'published_at', 'date'],
  slug: ['주소', 'slug', '글주소', '게시주소'],
  relatedQuestions: ['관련질문', '같이많이묻는질문', 'related', 'relatedquestions'],
} as const satisfies Record<string, readonly string[]>;
type HeaderKey = keyof typeof HEADER_ALIASES;

function columnIndex(headers: readonly string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

/** 시트 CSV를 행 객체로 읽는다. 필수 열이 없으면 오류를 던진다. */
export function readFaqSheetRows(csv: string): FaqSheetRow[] {
  const table = parseCsv(csv);
  if (table.length === 0) throw new Error('시트가 비어 있습니다');
  const headers = (table[0] ?? []).map(normalizeHeader);
  const index = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([key, aliases]) => [key, columnIndex(headers, aliases)]),
  ) as Record<HeaderKey, number>;
  for (const required of ['section', 'topic', 'question', 'summary'] as const) {
    if (index[required] < 0) throw new Error(`시트에 ${HEADER_ALIASES[required][0]} 열이 없습니다`);
  }
  const cell = (cells: readonly string[], key: HeaderKey): string =>
    index[key] >= 0 ? (cells[index[key]] ?? '').trim() : '';

  return table.slice(1).flatMap((cells, offset) => {
    const question = cleanFaqQuestion(cell(cells, 'question'));
    const section = cell(cells, 'section');
    const topic = cell(cells, 'topic');
    if (!question && !section && !topic) return [];
    return [{
      rowNumber: offset + 2,
      section,
      topic,
      question,
      summary: cell(cells, 'summary'),
      detailHtml: cell(cells, 'detailHtml'),
      perspective: cell(cells, 'perspective'),
      publishedOn: cell(cells, 'publishedOn'),
      slug: cell(cells, 'slug').toLowerCase(),
      relatedQuestions: cell(cells, 'relatedQuestions')
        .split(/\r?\n/u)
        .map((line) => cleanFaqQuestion(line.replace(/^[-•·*\d.)\s]+/u, '')))
        .filter(Boolean),
    }];
  });
}

// ---------------------------------------------------------------- 분류

function normalizeName(value: string): string {
  return value.replace(/[\s·・,/&]/gu, '').toLowerCase();
}

export type ResolvedFaqCategory = {
  section: FaqWireCategory;
  topic: FaqWireCategory;
};

/** 영역·질환을 CMS 분류 이름 또는 slug로 찾는다. */
export function resolveFaqCategory(
  categories: readonly FaqWireCategory[],
  section: string,
  topic: string,
): ResolvedFaqCategory | null {
  const roots = categories.filter((category) => !category.parentId);
  const root = roots.find(
    (category) =>
      normalizeName(category.name) === normalizeName(section) ||
      category.slug === section.trim().toLowerCase(),
  );
  if (!root) return null;
  const leaf = categories.find(
    (category) =>
      category.parentId === root.id &&
      (normalizeName(category.name) === normalizeName(topic) ||
        category.slug === topic.trim().toLowerCase()),
  );
  return leaf ? { section: root, topic: leaf } : null;
}

// ---------------------------------------------------------------- HTML → Tiptap

type Doc = { type: 'doc'; content: Record<string, unknown>[] };
type Mark = { type: string; attrs?: Record<string, unknown> };
type Inline = { type: 'text'; text: string; marks?: Mark[] } | { type: 'hardBreak' };

const BLOCK_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote']);
const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 'a', 'br', 'span']);
const HEADING_LEVEL: Record<string, number> = { h1: 2, h2: 2, h3: 3, h4: 4 };

class UnsupportedHtml extends Error {}

function isElement(node: ChildNode): node is Element {
  return node.type === 'tag';
}

function inlineNodes(nodes: readonly ChildNode[], marks: Mark[]): Inline[] {
  const result: Inline[] = [];
  for (const node of nodes) {
    if (node.type === 'text') {
      const text = node.data.replace(/\s+/gu, ' ');
      if (text) result.push({ type: 'text', text, ...(marks.length > 0 && { marks: [...marks] }) });
      continue;
    }
    if (!isElement(node)) continue;
    const tag = node.name.toLowerCase();
    if (tag === 'br') {
      result.push({ type: 'hardBreak' });
      continue;
    }
    if (!INLINE_TAGS.has(tag)) throw new UnsupportedHtml(tag);
    const nextMarks = [...marks];
    if (tag === 'strong' || tag === 'b') nextMarks.push({ type: 'bold' });
    if (tag === 'em' || tag === 'i') nextMarks.push({ type: 'italic' });
    if (tag === 'u') nextMarks.push({ type: 'underline' });
    if (tag === 'a') {
      const href = node.attribs.href?.trim();
      if (!href) throw new UnsupportedHtml('a[href 없음]');
      nextMarks.push({ type: 'link', attrs: { href } });
    }
    result.push(...inlineNodes(node.children, nextMarks));
  }
  return trimInline(result);
}

function trimInline(nodes: Inline[]): Inline[] {
  const first = nodes[0];
  if (first?.type === 'text') first.text = first.text.replace(/^\s+/u, '');
  const last = nodes[nodes.length - 1];
  if (last?.type === 'text') last.text = last.text.replace(/\s+$/u, '');
  return nodes.filter((node) => node.type !== 'text' || node.text !== '');
}

function paragraph(children: readonly ChildNode[]): Record<string, unknown> | null {
  const content = inlineNodes(children, []);
  return content.length > 0 ? { type: 'paragraph', content } : null;
}

function listItem(node: Element): Record<string, unknown> {
  const blocks: Record<string, unknown>[] = [];
  const pending: ChildNode[] = [];
  const flush = () => {
    const block = paragraph(pending);
    if (block) blocks.push(block);
    pending.length = 0;
  };
  for (const child of node.children) {
    if (isElement(child) && BLOCK_TAGS.has(child.name.toLowerCase())) {
      flush();
      blocks.push(...blockNodes([child]));
    } else {
      pending.push(child);
    }
  }
  flush();
  return { type: 'listItem', content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }] };
}

function blockNodes(nodes: readonly ChildNode[]): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const pending: ChildNode[] = [];
  const flush = () => {
    const block = paragraph(pending);
    if (block) blocks.push(block);
    pending.length = 0;
  };
  for (const node of nodes) {
    if (node.type === 'comment') continue;
    if (!isElement(node)) {
      pending.push(node);
      continue;
    }
    const tag = node.name.toLowerCase();
    if (!BLOCK_TAGS.has(tag) && !HEADING_LEVEL[tag]) {
      if (INLINE_TAGS.has(tag)) {
        pending.push(node);
        continue;
      }
      throw new UnsupportedHtml(tag);
    }
    flush();
    if (tag === 'p') {
      const block = paragraph(node.children);
      if (block) blocks.push(block);
    } else if (HEADING_LEVEL[tag]) {
      const content = inlineNodes(node.children, []);
      if (content.length > 0) {
        blocks.push({ type: 'heading', attrs: { level: HEADING_LEVEL[tag] }, content });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const items = node.children.filter(
        (child): child is Element => isElement(child) && child.name.toLowerCase() === 'li',
      );
      if (items.length > 0) {
        blocks.push({
          type: tag === 'ul' ? 'bulletList' : 'orderedList',
          content: items.map(listItem),
        });
      }
    } else if (tag === 'blockquote') {
      blocks.push({ type: 'blockquote', content: blockNodes(node.children) });
    }
  }
  flush();
  return blocks;
}

export type ConvertedFaqBody = {
  bodyJson: Record<string, unknown>;
  mode: 'tiptap' | 'importedHtml' | 'empty';
};

/** 시트 상세 답변 HTML을 Tiptap 문서로, 못 바꾸면 HTML 입력 블록으로 감싼다. */
export function convertFaqDetailHtml(html: string, scope: string): ConvertedFaqBody {
  const trimmed = html.trim();
  if (!trimmed) return { bodyJson: { type: 'doc', content: [] }, mode: 'empty' };
  try {
    const document = parseDocument(trimmed);
    const content = blockNodes(document.children);
    const doc: Doc = { type: 'doc', content };
    return { bodyJson: doc, mode: 'tiptap' };
  } catch (error) {
    if (!(error instanceof UnsupportedHtml)) throw error;
    return {
      bodyJson: {
        type: 'doc',
        content: [{ type: 'importedHtml', attrs: { html: trimmed, css: '', scope } }],
      },
      mode: 'importedHtml',
    };
  }
}

// ---------------------------------------------------------------- 관련 질문 → 토큰

export type FaqLinkTarget = {
  key: string;
  question: string;
};

export function faqLinkToken(key: string, label: string): string {
  return `[[internal:${key}|${label.replace(/\s+/gu, ' ').trim()}]]`;
}

function questionKey(value: string): string {
  return cleanFaqQuestion(value).replace(/[\s?？.!]/gu, '').toLowerCase();
}

/** 질문 문장을 시트·CMS의 FAQ 키에 맞춘다. 물음표·공백 차이는 무시한다. */
export function matchFaqQuestion(
  targets: readonly FaqLinkTarget[],
  question: string,
): FaqLinkTarget | null {
  const wanted = questionKey(question);
  if (!wanted) return null;
  return targets.find((target) => questionKey(target.question) === wanted) ?? null;
}

type RelatedRewrite = { doc: Record<string, unknown>; unmatched: string[]; linked: string[] };

function textOf(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') return node.text;
  const content = Array.isArray(node.content) ? (node.content as Record<string, unknown>[]) : [];
  return content.map(textOf).join('');
}

/**
 * "같이 많이 묻는 질문" 제목 바로 뒤 목록의 각 항목을 예약 토큰으로 바꾼다.
 * 항목이 이미 링크 마크를 가지거나 토큰이면 건드리지 않는다.
 */
export function rewriteRelatedQuestionList(
  doc: Record<string, unknown>,
  targets: readonly FaqLinkTarget[],
  selfKey: string,
): RelatedRewrite {
  const unmatched: string[] = [];
  const linked: string[] = [];
  const content = Array.isArray(doc.content) ? [...(doc.content as Record<string, unknown>[])] : [];
  for (let index = 0; index < content.length - 1; index += 1) {
    const block = content[index];
    const list = content[index + 1];
    if (!block || !list) continue;
    if (block.type !== 'heading' || !RELATED_HEADING_PATTERN.test(textOf(block))) continue;
    if (list.type !== 'bulletList' && list.type !== 'orderedList') continue;
    const items = Array.isArray(list.content) ? (list.content as Record<string, unknown>[]) : [];
    const nextItems = items.map((item) => {
      const label = textOf(item).trim();
      if (!label || /\[\[internal:/u.test(label)) return item;
      const target = matchFaqQuestion(targets, label);
      if (!target || target.key === selfKey) {
        unmatched.push(label);
        return item;
      }
      linked.push(target.key);
      return {
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: faqLinkToken(target.key, label) }] }],
      };
    });
    content[index + 1] = { ...list, content: nextItems };
  }
  return { doc: { ...doc, content }, unmatched, linked };
}

// ---------------------------------------------------------------- 계획

export type FaqSheetPlanInput = {
  rows: readonly FaqSheetRow[];
  categories: readonly FaqWireCategory[];
  existing: readonly ExistingFaqPost[];
  /** importedHtml 블록의 scope id를 만드는 함수(테스트에서 고정값을 준다). */
  scopeId: (row: FaqSheetRow) => string;
};

function existingLinkTargets(
  existing: readonly ExistingFaqPost[],
  categories: readonly FaqWireCategory[],
): FaqLinkTarget[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return existing.flatMap((post) => {
    const leaf = post.categoryIds.map((id) => byId.get(id)).find((category) => category?.parentId);
    const root = leaf?.parentId ? byId.get(leaf.parentId) : undefined;
    if (!leaf || !root) return [];
    return [{
      key: faqSheetLinkKey(root.slug, leaf.slug, post.slug),
      question: post.title,
    }];
  });
}

/** 시트 행 전체를 CMS 계획으로 바꾼다. 행 오류는 모아 돌려주고 계획을 멈추지 않는다. */
export function planFaqSheetImport(input: FaqSheetPlanInput): FaqSheetImportPlan {
  const errors: string[] = [];
  const warnings: string[] = [];
  const resolvedRows = input.rows.flatMap((row) => {
    const resolved = resolveFaqCategory(input.categories, row.section, row.topic);
    if (!row.question) {
      errors.push(`${row.rowNumber}행: 질문이 비어 있습니다`);
      return [];
    }
    if (!row.summary) errors.push(`${row.rowNumber}행: 요약답변이 비어 있습니다`);
    if (!resolved) {
      errors.push(`${row.rowNumber}행: 분류를 찾을 수 없습니다 — ${row.section} › ${row.topic}`);
      return [];
    }
    const slug = row.slug || faqQuestionSlug(row.question);
    if (!/^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/u.test(slug)) {
      errors.push(`${row.rowNumber}행: 주소 형식이 올바르지 않습니다 — ${slug}`);
      return [];
    }
    return [{ row, resolved, slug, slugDerived: !row.slug }];
  });

  const seenSlugs = new Map<string, number>();
  for (const { row, slug } of resolvedRows) {
    const first = seenSlugs.get(slug);
    if (first) errors.push(`${row.rowNumber}행: ${first}행과 주소가 같습니다 — ${slug}`);
    else seenSlugs.set(slug, row.rowNumber);
  }

  const sheetTargets: FaqLinkTarget[] = resolvedRows.map(({ row, resolved, slug }) => ({
    key: faqSheetLinkKey(resolved.section.slug, resolved.topic.slug, slug),
    question: row.question,
  }));
  const targets = [...sheetTargets, ...existingLinkTargets(input.existing, input.categories)];
  const existingBySlug = new Map(input.existing.map((post) => [post.slug, post]));

  const create: FaqSheetSeed[] = [];
  const keep: { seed: FaqSheetSeed; post: ExistingFaqPost }[] = [];
  for (const { row, resolved, slug, slugDerived } of resolvedRows) {
    const key = faqSheetLinkKey(resolved.section.slug, resolved.topic.slug, slug);
    const rowWarnings: string[] = [];
    if (slugDerived) rowWarnings.push(`주소 열이 비어 질문에서 만든 주소를 씁니다 — ${slug}`);

    const converted = convertFaqDetailHtml(row.detailHtml, input.scopeId(row));
    let bodyJson = converted.bodyJson;
    if (converted.mode === 'importedHtml') {
      rowWarnings.push('상세 답변에 지원하지 않는 HTML 태그가 있어 HTML 입력 블록으로 보존합니다');
    } else if (converted.mode === 'tiptap') {
      const rewritten = rewriteRelatedQuestionList(bodyJson, targets, key);
      bodyJson = rewritten.doc;
      for (const label of rewritten.unmatched) {
        rowWarnings.push(`같이 많이 묻는 질문을 시트·CMS에서 찾지 못해 문구만 남깁니다 — ${label}`);
      }
    }

    const relatedKeys: string[] = [];
    for (const question of row.relatedQuestions) {
      const target = matchFaqQuestion(targets, question);
      if (!target || target.key === key) {
        rowWarnings.push(`관련 질문을 시트·CMS에서 찾지 못했습니다 — ${question}`);
        continue;
      }
      if (!relatedKeys.includes(target.key)) relatedKeys.push(target.key);
    }
    if (relatedKeys.length > MAX_RELATED_KEYS) {
      rowWarnings.push(`관련 질문은 최대 ${MAX_RELATED_KEYS}개만 예약합니다`);
      relatedKeys.length = MAX_RELATED_KEYS;
    }

    const fieldValues: Record<string, unknown> = {};
    if (row.perspective) fieldValues.clinic_perspective = row.perspective;

    const seed: FaqSheetSeed = {
      rowNumber: row.rowNumber,
      slug,
      slugDerived,
      title: row.question,
      excerpt: row.summary,
      bodyJson,
      bodyMode: converted.mode,
      categoryId: resolved.topic.id,
      categoryPath: [resolved.section.slug, resolved.topic.slug],
      key,
      publishedOn: row.publishedOn,
      fieldValues,
      relatedContentKeys: relatedKeys,
      warnings: rowWarnings,
    };
    warnings.push(...rowWarnings.map((warning) => `${row.rowNumber}행: ${warning}`));

    const existing = existingBySlug.get(slug);
    if (existing) {
      if (existing.title !== seed.title) {
        warnings.push(`${row.rowNumber}행: CMS에 같은 주소의 글이 있어 건드리지 않습니다 (제목 다름: ${existing.title})`);
      }
      keep.push({ seed, post: existing });
    } else {
      create.push(seed);
    }
  }
  return { create, keep, errors, warnings };
}
