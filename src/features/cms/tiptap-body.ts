/**
 * ROOT-ADMIN(Tiptap) 본문 JSON → 안전한 HTML 렌더러.
 *
 * 서버가 내려주는 `bodyJson`은 살균되지 않은 상태라는 것이 CMS 계약이다
 * ("Sanitization is renderer's responsibility"). 그래서 일반 Tiptap 노드는 허용
 * 노드만 화이트리스트로 내보내고, 텍스트·속성은 전부 이스케이프한다. ROOT-ADMIN의
 * HTML 가져오기는 원문을 `importedHtml.attrs.html`에 보관하므로, 이 노드만 공용
 * HTML 살균기를 거친다. 링크는 기존 HTTPS·사이트 상대 경로 정책을, 이미지는
 * 배포 사이트·RootTale API origin 정책을 적용한다.
 *
 * 후기와 칼럼이 같은 렌더러를 공유하되 래퍼 클래스 이름만 다르므로,
 * 클래스 접두사를 옵션으로 받는다.
 */
import { cmsFontSize, cmsLineHeight, cmsParagraphSpacing, cmsImageStyle, cmsImageWidth, sanitizeHtml } from '@roottale/cms-core';
import { removeEmDashes } from './content-text';
import { cfImageSrcSet, cfImageVariantUrl } from './cf-image-url';
import {
  renderInternalContentLinks,
  renderInternalContentLinksInSanitizedHtml,
  type PublishedInternalContentPaths,
} from './internal-content-links';
import { localizeCmsHref, sanitizeImportedCmsHtml, trustedImageUrl } from './raw-html';

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: readonly unknown[];
  marks?: readonly unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nodeFrom(value: unknown): TiptapNode | null {
  if (!isRecord(value)) return null;
  return {
    type: typeof value.type === 'string' ? value.type : undefined,
    text: typeof value.text === 'string' ? value.text : undefined,
    attrs: isRecord(value.attrs) ? value.attrs : undefined,
    content: Array.isArray(value.content) ? value.content : undefined,
    marks: Array.isArray(value.marks) ? value.marks : undefined,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeUrl(value: unknown): string | null {
  return localizeCmsHref(value);
}

function wrapTextMarks(
  text: string,
  marks: readonly unknown[],
  publishedInternalPaths?: PublishedInternalContentPaths,
): string {
  const cleanedText = removeEmDashes(text);
  const renderedInternalLinks = publishedInternalPaths
    ? renderInternalContentLinks(cleanedText, publishedInternalPaths)
    : null;
  let html = renderedInternalLinks?.html ?? escapeHtml(cleanedText);
  for (const value of marks) {
    if (!isRecord(value) || typeof value.type !== 'string') continue;
    const attrs = isRecord(value.attrs) ? value.attrs : {};
    switch (value.type) {
      case 'bold':
        html = `<strong>${html}</strong>`;
        break;
      case 'italic':
        html = `<em>${html}</em>`;
        break;
      case 'underline':
        html = `<u>${html}</u>`;
        break;
      case 'strike':
        html = `<s>${html}</s>`;
        break;
      case 'code':
        html = `<code>${html}</code>`;
        break;
      case 'textStyle': {
        const fontSize = cmsFontSize(attrs.fontSize);
        const color = typeof attrs.color === 'string' && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(attrs.color) ? attrs.color : null;
        const style = [fontSize ? `font-size:${fontSize}` : '', color ? `color:${color}` : ''].filter(Boolean).join(';');
        if (style) html = `<span style="${style}">${html}</span>`;
        break;
      }
      case 'highlight': {
        const color = typeof attrs.color === 'string' ? attrs.color : '#ffff00';
        html = sanitizeHtml(`<mark style="background:${escapeHtml(color)}">${html}</mark>`);
        break;
      }
      case 'link': {
        // 예약 내부 링크 토큰은 자체 발행 상태로 href를 결정한다. 일반 link mark로
        // 다시 감싸면 미발행 대상도 링크가 되거나 중첩 <a>가 생길 수 있어 무시한다.
        if (renderedInternalLinks?.hasTokens) break;
        const href = safeUrl(attrs.href);
        if (!href) break;
        const external = /^https:\/\//i.test(href);
        html = `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${html}</a>`;
        break;
      }
    }
  }
  return html;
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 10_000 ? parsed : null;
}

function renderChildren(
  node: TiptapNode,
  prefix: string,
  publishedInternalPaths?: PublishedInternalContentPaths,
): string {
  return (node.content ?? [])
    .map((child) => renderNode(child, prefix, publishedInternalPaths))
    .join('');
}

function styleAttribute(style: Record<string, string | number>): string {
  const css = Object.entries(style).map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`).join(';');
  return css ? ` style="${escapeHtml(css)}"` : '';
}

function paragraphStyle(attrs: Record<string, unknown> = {}): string {
  const lineHeight = cmsLineHeight(attrs.lineHeight);
  const marginBottom = cmsParagraphSpacing(attrs.paragraphSpacing);
  const align = attrs.textAlign;
  return styleAttribute({
    ...(lineHeight !== null ? { lineHeight } : {}),
    ...(marginBottom !== null ? { marginBottom } : {}),
    ...(align === 'left' || align === 'center' || align === 'right' || align === 'justify' ? { textAlign: align } : {}),
  });
}

function renderNode(
  value: unknown,
  prefix: string,
  publishedInternalPaths?: PublishedInternalContentPaths,
): string {
  const node = nodeFrom(value);
  if (!node) return '';
  if (node.type === 'text') {
    return wrapTextMarks(node.text ?? '', node.marks ?? [], publishedInternalPaths);
  }

  const children = renderChildren(node, prefix, publishedInternalPaths);
  switch (node.type) {
    case 'doc':
      return children;
    case 'paragraph': {
      const spacer = /^(?:\s|<br>)*$/.test(children);
      return `<p${spacer ? ' data-cms-spacer="true"' : ''}${paragraphStyle(node.attrs)}>${children || '<br>'}</p>`;
    }
    case 'heading': {
      const level = Math.min(Math.max(positiveInteger(node.attrs?.level) ?? 2, 2), 4);
      return `<h${level}${paragraphStyle(node.attrs)}>${children}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${children}</ul>`;
    case 'orderedList':
      return `<ol>${children}</ol>`;
    case 'listItem':
      return `<li>${children}</li>`;
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${children}</code></pre>`;
    case 'horizontalRule':
      return '<hr>';
    case 'hardBreak':
      return '<br>';
    case 'importedHtml':
      // ROOT-ADMIN HTML 가져오기는 Tiptap 트리로 분해하지 않고 원문 HTML을 attrs에
      // 넣는다. 일반 노드처럼 children만 렌더하면 본문이 조용히 비어 버린다.
      // 가져온 원문에는 구획을 나타내는 클래스가 없으므로, 정화 뒤에만 고정 래퍼를
      // 둬서 일반 CMS 본문과 다른 읽기 규칙을 안전하게 적용한다.
      {
        const sanitizedHtml = sanitizeImportedCmsHtml(node.attrs?.html);
        if (!sanitizedHtml) return '';
        const html = publishedInternalPaths
          ? renderInternalContentLinksInSanitizedHtml(
            sanitizedHtml,
            publishedInternalPaths,
          ).html
          : sanitizedHtml;
        return `<div class="${prefix}__imported">${html}</div>`;
      }
    case 'image': {
      const src = trustedImageUrl(node.attrs?.src);
      if (!src) return '';
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : '';
      const title = typeof node.attrs?.title === 'string' ? node.attrs.title : null;
      const width = positiveInteger(node.attrs?.width);
      const height = positiveInteger(node.attrs?.height);
      const srcSet = cfImageSrcSet(src);
      const displaySrc = cfImageVariantUrl(src, 'md');
      const caption = typeof node.attrs?.caption === 'string' ? node.attrs.caption : '';
      const layout = styleAttribute(cmsImageStyle(node.attrs ?? {}));
      const imageStyle = cmsImageWidth(node.attrs?.displayWidth) ? ' style="width:100%;max-width:100%;height:auto"' : '';
      return `<figure${layout}><img${imageStyle} src="${escapeHtml(displaySrc)}" alt="${escapeHtml(alt)}"${srcSet ? ` srcset="${escapeHtml(srcSet)}" sizes="(max-width: 767px) 100vw, 720px"` : ''}${title ? ` title="${escapeHtml(title)}"` : ''}${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''} loading="lazy" decoding="async" referrerpolicy="no-referrer">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
    }
    case 'columns':
      return `<div class="${prefix}__columns">${children}</div>`;
    case 'column':
      return `<div>${children}</div>`;
    case 'table':
      return `<div class="${prefix}__table"><table><tbody>${children}</tbody></table></div>`;
    case 'tableRow':
      return `<tr>${children}</tr>`;
    case 'tableHeader':
    case 'tableCell': {
      const tag = node.type === 'tableHeader' ? 'th' : 'td';
      const colSpan = positiveInteger(node.attrs?.colspan);
      const rowSpan = positiveInteger(node.attrs?.rowspan);
      return `<${tag}${colSpan && colSpan > 1 ? ` colspan="${colSpan}"` : ''}${rowSpan && rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''}>${children}</${tag}>`;
    }
    case 'faq':
      return `<div class="${prefix}__faq">${children}</div>`;
    case 'faqItem':
      return `<details>${children}</details>`;
    case 'faqQuestion':
      return `<summary>${children}</summary>`;
    case 'faqAnswer':
      return `<div>${children}</div>`;
    case 'tableOfContents':
    case 'section':
    case 'embed':
      return '';
    default:
      return children;
  }
}

/**
 * `bodyJson`을 HTML 문자열로 바꿄다. `classPrefix`는 래퍼 노드(다단·표·FAQ)에
 * 붙는 클래스 접두사로, 소비하는 라우트의 본문 스타일 이름과 맞춘다.
 */
export function renderTiptapBody(
  bodyJson: Record<string, unknown>,
  classPrefix: string,
  publishedInternalPaths?: PublishedInternalContentPaths,
): string {
  return renderNode(bodyJson, classPrefix, publishedInternalPaths);
}
