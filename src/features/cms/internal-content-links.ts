const INTERNAL_CONTENT_LINK_TOKEN_SOURCE =
  String.raw`\[\[internal:([a-z0-9가-힣]+(?:[.-][a-z0-9가-힣]+)*)\|([^\]\n]+)\]\]`;

function internalContentLinkTokenPattern(): RegExp {
  return new RegExp(INTERNAL_CONTENT_LINK_TOKEN_SOURCE, 'giu');
}

function internalContentLinkKeysInText(text: string): string[] {
  return [...text.matchAll(internalContentLinkTokenPattern())]
    .flatMap((match) => match[1] ? [match[1].toLowerCase()] : []);
}

export type PublishedInternalContentPaths = ReadonlyMap<string, string>;

export type RenderedInternalContentLinks = {
  html: string;
  hasTokens: boolean;
};

type TextEscaper = (value: string) => string;

const INTERNAL_LINK_BLOCKED_HTML_TAGS = new Set([
  'a',
  'code',
  'pre',
  'script',
  'style',
  'textarea',
]);

const VOID_HTML_TAGS = new Set(['br', 'hr', 'img']);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function publishedInternalPath(
  key: string,
  paths: PublishedInternalContentPaths,
): string | null {
  const path = paths.get(key);
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

/**
 * 예약 내부 링크 토큰을 공개 HTML로 바꾼다.
 *
 * 대상 키가 공개 원장에 있으면 링크, 없으면 href 없는 일반 문구로 렌더한다.
 * 미해결 키는 data 속성으로만 남겨 배포 QA에서 찾을 수 있게 한다.
 */
export function renderInternalContentLinks(
  text: string,
  publishedPaths: PublishedInternalContentPaths,
): RenderedInternalContentLinks {
  return renderInternalContentLinksWithEscaper(text, publishedPaths, escapeHtml);
}

function renderInternalContentLinksWithEscaper(
  text: string,
  publishedPaths: PublishedInternalContentPaths,
  escapeText: TextEscaper,
): RenderedInternalContentLinks {
  let cursor = 0;
  let hasTokens = false;
  let html = '';

  for (const match of text.matchAll(internalContentLinkTokenPattern())) {
    const index = match.index;
    const key = match[1]?.toLowerCase();
    const label = match[2]?.trim();
    if (index === undefined || !key || !label) continue;

    hasTokens = true;
    html += escapeText(text.slice(cursor, index));
    const path = publishedInternalPath(key, publishedPaths);
    if (path) {
      html += `<a href="${escapeHtml(path)}">${escapeText(label)}</a>`;
    } else {
      html += `<span data-internal-link-pending="${escapeHtml(key)}">${escapeText(label)}</span>`;
    }
    cursor = index + match[0].length;
  }

  html += escapeText(text.slice(cursor));
  return { html, hasTokens };
}

function htmlTagEnd(html: string, start: number): number {
  let quote: '"' | "'" | null = null;
  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '>') return index;
  }
  return -1;
}

function transformHtmlTextSegments(
  html: string,
  transform: (text: string, blocked: boolean) => string,
): string {
  const blockedDepths = new Map<string, number>();
  let blockedDepth = 0;
  let cursor = 0;
  let transformed = '';

  while (cursor < html.length) {
    const tagStart = html.indexOf('<', cursor);
    if (tagStart < 0) {
      transformed += transform(html.slice(cursor), blockedDepth > 0);
      break;
    }
    transformed += transform(html.slice(cursor, tagStart), blockedDepth > 0);

    const tagEnd = htmlTagEnd(html, tagStart);
    if (tagEnd < 0) {
      transformed += transform(html.slice(tagStart), blockedDepth > 0);
      break;
    }

    const tag = html.slice(tagStart, tagEnd + 1);
    transformed += tag;
    const parsed = /^<\s*(\/?)\s*([a-z0-9-]+)/i.exec(tag);
    const tagName = parsed?.[2]?.toLowerCase();
    if (tagName && INTERNAL_LINK_BLOCKED_HTML_TAGS.has(tagName)) {
      const isClosing = parsed?.[1] === '/';
      const isVoid = VOID_HTML_TAGS.has(tagName) || /\/\s*>$/.test(tag);
      const currentDepth = blockedDepths.get(tagName) ?? 0;
      if (isClosing) {
        if (currentDepth > 0) {
          blockedDepths.set(tagName, currentDepth - 1);
          blockedDepth -= 1;
        }
      } else if (!isVoid) {
        blockedDepths.set(tagName, currentDepth + 1);
        blockedDepth += 1;
      }
    }
    cursor = tagEnd + 1;
  }

  return transformed;
}

/**
 * 이미 정화된 HTML의 텍스트 구간에만 예약 내부 링크를 적용한다.
 *
 * HTML 속성 및 기존 링크와 코드 예시는 원문 그대로 보존한다. 텍스트는 정화기가
 * 이미 이스케이프한 값이므로 다시 이스케이프하지 않아 HTML entity를 중복 변환하지 않는다.
 */
export function renderInternalContentLinksInSanitizedHtml(
  html: string,
  publishedPaths: PublishedInternalContentPaths,
): RenderedInternalContentLinks {
  let hasTokens = false;
  const renderedHtml = transformHtmlTextSegments(html, (text, blocked) => {
    if (blocked) return text;
    const rendered = renderInternalContentLinksWithEscaper(text, publishedPaths, (value) => value);
    hasTokens ||= rendered.hasTokens;
    return rendered.html;
  });
  return { html: renderedHtml, hasTokens };
}

function importedHtmlHasInternalContentLinkToken(html: string): boolean {
  let hasTokens = false;
  transformHtmlTextSegments(html, (text, blocked) => {
    if (!blocked && internalContentLinkTokenPattern().test(text)) hasTokens = true;
    return text;
  });
  return hasTokens;
}

function importedHtmlInternalContentLinkKeys(html: string): string[] {
  const keys: string[] = [];
  transformHtmlTextSegments(html, (text, blocked) => {
    if (!blocked) keys.push(...internalContentLinkKeysInText(text));
    return text;
  });
  return keys;
}

/** Tiptap·HTML 입력 본문이 참조하는 예약 콘텐츠 키를 중복 없이 읽는다. */
export function internalContentLinkKeys(value: unknown): readonly string[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  if (record.type === 'text' && typeof record.text === 'string') {
    return [...new Set(internalContentLinkKeysInText(record.text))];
  }
  if (record.type === 'importedHtml' && record.attrs && typeof record.attrs === 'object') {
    const html = (record.attrs as Record<string, unknown>).html;
    return typeof html === 'string'
      ? [...new Set(importedHtmlInternalContentLinkKeys(html))]
      : [];
  }
  if (!Array.isArray(record.content)) return [];
  return [...new Set(record.content.flatMap(internalContentLinkKeys))];
}

/** 공개 본문 원장 선택에 쓰기 위해 Tiptap 텍스트와 HTML 입력 본문의 예약 토큰을 찾는다. */
export function hasInternalContentLinkToken(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.type === 'text' && typeof record.text === 'string') {
    return internalContentLinkTokenPattern().test(record.text);
  }
  if (record.type === 'importedHtml' && record.attrs && typeof record.attrs === 'object') {
    const html = (record.attrs as Record<string, unknown>).html;
    return typeof html === 'string' && importedHtmlHasInternalContentLinkToken(html);
  }
  return Array.isArray(record.content) && record.content.some(hasInternalContentLinkToken);
}
