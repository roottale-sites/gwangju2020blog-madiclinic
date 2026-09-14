/**
 * CMS가 내려주는 **원본 HTML**(`body_html`) 정화기.
 *
 * ROOT-ADMIN이 새로 내려주는 `body_html`은 살균되지 않은 상태로 온다. `bodyJson`은
 * 우리 화이트리스트 렌더러(`renderTiptapBody`)를 거치므로 태그가 통제되지만,
 * 원본 HTML은 서버가 준 문자열을 그대로 DOM에 꽂는 것이라 유일한 방어선이
 * 렌더 직전의 정화다. 그래서 공용 RootTale 살균기(`@roottale/cms-core`의
 * `sanitizeHtml`)를 쓴다 — 사이트마다 화이트리스트를 새로 짜면 플랫폼과
 * 판정이 갈린다.
 *
 * 다만 공용 화이트리스트에는 `<thead>`·`<tfoot>`·`<b>`가 없다. 셋 다 위험한
 * 태그가 아니라 표 구조와 굵기 의미를 나르는 태그인데, 그대로 통과시키면
 * `<thead>`는 벗겨져 헤더 행이 표 밖으로 밀려나고(`.column-richtext thead th`
 * 스타일이 죽는다) `<b>`는 굵기가 사라진다. 그래서 **살균기를 갈아치우지 않고**
 * 그 앞뒤에 최소한의 어댑터만 둔다.
 *
 * - `<b>` → `<strong>`: 같은 굵기 의미이고 화이트리스트에 있다.
 * - `<thead>`·`<tfoot>` → 허용된 `<tbody class="rt-*">`로 가렸다가 살균 뒤 되돌린다.
 *   `rt-` 접두사는 살균기가 유일하게 허용하는 클래스 형태다.
 *
 * 안전성은 그대로다. 가림·복원은 **살균 전후의 태그 이름만** 다루고, 속성과
 * URL 스킴 판정은 공용 살균기에 맡기고, 이미지는 그 결과에 이 사이트의 명시적
 * origin 정책을 한 번 더 적용한다. 공격자가 `<thead>`나 마커를 직접 넣어봐야
 * 얻는 것은 무해한 표 구조 태그뿐이다.
 *
 * 이관 JSON도 렌더 직전 같은 정화 경계를 거친다. Tiptap은 태그 화이트리스트
 * 렌더러를 쓰되 이미지에 아래와 같은 origin 정책을 공유한다.
 */
import { sanitizeHtml } from '@roottale/cms-core';
import sanitizeHtmlLibrary from 'sanitize-html';

import { siteOrigin } from '../../data/site';
import { isCfImageUrl } from './cf-image-url';
import { removeEmDashes } from './content-text';

const DEFAULT_ROOTTALE_API_BASE = 'https://api.roottale.com';
/** 이 배포의 origin. 자기 자신을 가리키는 절대 링크만 상대 경로로 바꾼다. */
const deployOrigin = new URL(siteOrigin).origin;
/**
 * ROOT-ADMIN 미디어 저장소(R2 공개 버킷)의 공개 도메인.
 *
 * 대표 이미지는 Cloudflare Images(`imagedelivery.net`) 주소로 내려오지만, 본문
 * 안에 끌어다 놓거나 붙여 넣은 사진·PDF는 이 저장소 주소로 `body_json`에 남는다.
 * 이 origin을 빼면 본문 사진이 조용히 사라진다(2026-08-18 회귀).
 * 저장소 주소가 바뀌면 `ROOTTALE_MEDIA_ORIGIN`으로 덮어쓴다.
 *
 * `r2.dev` 주소는 2026-08-18 커스텀 도메인 전환 전에 발행된 글에 남아 있는 옛
 * 주소다. 그 주소는 리다이렉트를 걸 수 없어 계속 서빙되므로 함께 허용한다.
 */
const DEFAULT_ROOTTALE_MEDIA_ORIGIN = 'https://root-cdn.com';
const LEGACY_ROOTTALE_MEDIA_ORIGIN = 'https://pub-a24f0d2a79bf462a81114ae930fcd320.r2.dev';

/** 살균기가 허용하는 유일한 클래스 형태(`/^rt-[a-z0-9_-]+$/`)를 마커로 쓴다. */
const SECTION_MARKERS = [
  { tag: 'thead', marker: 'rt-thead' },
  { tag: 'tfoot', marker: 'rt-tfoot' },
] as const;

/**
 * ROOT-ADMIN HTML 가져오기 전용 허용 목록.
 *
 * 일반 CMS 본문은 RootTale 공용 정책을 그대로 따른다. 반면 가져온 HTML은 작성자가
 * 부여한 class·id와 레이아웃용 인라인 CSS가 글의 구조 자체인 경우가 있어, 별도의
 * 좁은 정책을 둔다. `<style>`·스크립트·외부 리소스를 부르는 CSS는 허용하지 않는다.
 */
const IMPORTED_HTML_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'cite', 'code', 'del', 'details', 'div', 'em',
  'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'li', 'mark',
  'ol', 'p', 'pre', 's', 'section', 'small', 'span', 'strong', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
];

const IMPORTED_STYLE_VALUE = /^(?!.*(?:url\s*\(|expression\s*\(|@import|behavior\s*:|-moz-binding))[\w\s#%.,()/'"+\-*/]+$/i;

const IMPORTED_STYLE_PROPERTIES = [
  'align-items', 'align-self', 'aspect-ratio', 'background', 'background-color', 'border',
  'border-bottom', 'border-collapse', 'border-color', 'border-left', 'border-radius', 'border-right', 'border-style',
  'border-top', 'border-width', 'box-shadow', 'color', 'column-gap', 'display', 'flex',
  'flex-basis', 'flex-direction', 'flex-grow', 'flex-shrink', 'flex-wrap', 'font-family',
  'font-size', 'font-style', 'font-weight', 'gap', 'grid-column', 'grid-row', 'grid-template-columns',
  'grid-template-rows', 'height', 'justify-content', 'justify-items', 'letter-spacing', 'line-height',
  'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'max-height', 'max-width',
  'min-height', 'min-width', 'object-fit', 'opacity', 'order', 'overflow', 'overflow-wrap', 'padding',
  'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration',
  'text-indent', 'text-transform', 'vertical-align', 'white-space', 'width', 'word-break',
] as const;

const IMPORTED_ALLOWED_STYLES = Object.fromEntries(
  IMPORTED_STYLE_PROPERTIES.map((property) => [property, [IMPORTED_STYLE_VALUE]]),
);

const IMPORTED_ALLOWED_ATTRIBUTES = {
  '*': ['class', 'id', 'data-*', 'style'],
  a: ['href', 'title', 'rel', 'target', 'class', 'id', 'data-*', 'style'],
  details: ['open', 'class', 'id', 'data-*', 'style'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class', 'id', 'data-*', 'style'],
  td: ['colspan', 'rowspan', 'class', 'id', 'data-*', 'style'],
  th: ['colspan', 'rowspan', 'class', 'id', 'data-*', 'style'],
};

const DANGEROUS_ELEMENT_TOKEN_RE = /<\/?[^>\s/]*(?:script|style|iframe|object|embed|svg|math|template)[^>\s/]*(?:\s[^>]*)?>[\s\S]*?<\/?[^>\s/]*(?:script|style|iframe|object|embed|svg|math|template)[^>\s/]*(?:\s[^>]*)?>/gi;

function stripDangerousElementTokens(html: string): string {
  let stripped = html;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const next = stripped.replace(DANGEROUS_ELEMENT_TOKEN_RE, '');
    if (next === stripped) return stripped;
    stripped = next;
  }
  return stripped;
}

/**
 * `<b>` → `<strong>`. 속성은 그대로 넘겨 살균기가 판정하게 둔다.
 *
 * `(\s[^>]*)?` 때문에 `<br>`·`<blockquote>`처럼 `b`로 시작하는 다른 태그는
 * 걸리지 않는다(`<b` 다음이 공백이나 `>`여야 한다).
 */
function normalizeBold(html: string): string {
  return html
    .replace(/<b(\s[^>]*)?>/gi, (_match, attrs: string | undefined) => `<strong${attrs ?? ''}>`)
    .replace(/<\/b\s*>/gi, '</strong>');
}

/**
 * `<thead>`·`<tfoot>`을 허용 태그로 가린다.
 *
 * 원래 속성은 통째로 버린다. 표 구획 태그의 속성은 본문 의미를 나르지 않고,
 * 남겨 두면 마커 클래스와 중복 속성이 생겨 판정이 모호해진다.
 */
function maskSectionTags(html: string): string {
  let masked = html;
  for (const { tag, marker } of SECTION_MARKERS) {
    masked = masked
      .replace(new RegExp(`<${tag}\\b[^>]*>`, 'gi'), `<tbody class="${marker}">`)
      .replace(new RegExp(`</${tag}\\s*>`, 'gi'), '</tbody>');
  }
  return masked;
}

/**
 * 살균된 HTML에서 마커를 원래 태그로 되돌린다.
 *
 * 여는/닫는 `<tbody>`를 스택으로 짝지어야 한다. 표 안에 표가 들어오면 마커
 * `tbody` 안에 평범한 `tbody`가 중첩되므로, `</tbody>`를 일괄 치환하면 짝이
 * 어긋나 구조가 무너진다.
 */
function restoreSectionTags(html: string): string {
  const stack: string[] = [];
  return html.replace(
    /<tbody(\s[^>]*)?>|<\/tbody\s*>/gi,
    (match, attrs: string | undefined) => {
      if (match.startsWith('</')) {
        return `</${stack.pop() ?? 'tbody'}>`;
      }
      const classNames = /class="([^"]*)"/i.exec(attrs ?? '')?.[1]?.split(/\s+/) ?? [];
      const restored = SECTION_MARKERS.find(({ marker }) => classNames.includes(marker));
      stack.push(restored?.tag ?? 'tbody');
      return restored ? `<${restored.tag}>` : match;
    },
  );
}

function httpsOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

function trustedImageOrigins(): ReadonlySet<string> {
  const apiBase = process.env.ROOTTALE_API_BASE?.trim() || DEFAULT_ROOTTALE_API_BASE;
  const mediaOrigin = process.env.ROOTTALE_MEDIA_ORIGIN?.trim() || DEFAULT_ROOTTALE_MEDIA_ORIGIN;
  const origins = [
    httpsOrigin(siteOrigin),
    httpsOrigin(apiBase),
    httpsOrigin(mediaOrigin),
    httpsOrigin(LEGACY_ROOTTALE_MEDIA_ORIGIN),
  ].filter(
    (origin): origin is string => origin !== null,
  );
  return new Set(origins);
}

/**
 * 이미지 URL의 단일 신뢰 정책.
 *
 * 루트 상대 경로는 배포 사이트 origin으로 해석된다. 절대 URL은 HTTPS이면서
 * 배포 사이트, 또는 현재 설정된(없으면 기본) RootTale API·미디어 저장소 origin과
 * 정확히 일치할 때만 돌려준다. 링크의 외부 HTTPS 허용 정책과는 의도적으로 다르다.
 */
export function trustedImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;

  const origin = httpsOrigin(url);
  return origin && (trustedImageOrigins().has(origin) || isCfImageUrl(url)) ? url : null;
}

/**
 * CMS 본문에는 편집자가 붙여 넣은 이 배포 자신의 절대 링크가 남을 수 있다. 표준 렌더
 * 경로는 같은 배포의 상대 주소로 바꾸되, 원문 보존이 계약인 HTML 가져오기 경로에는 쓰지
 * 않는다. 외부 HTTPS·메일·전화 링크는 그대로 둔다.
 *
 * headnerve가 쓰던 이관 원본 사이트 origin은 이 저장소에 없다. 이관 콘텐츠가 없어
 * 기준 origin은 배포 사이트 하나다(PLAN.md §5.1).
 */
export function localizeCmsHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const href = value.trim();
  if (!href) return null;
  if (
    (href.startsWith('/') && !href.startsWith('//')) ||
    href.startsWith('#') ||
    href.startsWith('?') ||
    /^(mailto:|tel:)/i.test(href)
  ) {
    return href;
  }
  if (!/^https:\/\//i.test(href)) return null;

  try {
    const url = new URL(href);
    return url.origin === deployOrigin
      ? `${url.pathname}${url.search}${url.hash}`
      : href;
  } catch {
    return null;
  }
}

function localizeLegacyAnchors(html: string): string {
  return html.replace(/(<a\b[^>]*\bhref=")([^"]*)(")/gi, (_match, before, href, after) => {
    const localized = localizeCmsHref(href);
    return localized ? `${before}${localized}${after}` : `${before}${href}${after}`;
  });
}

function imageSource(imageTag: string): string | null {
  const match = /\bsrc=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(imageTag);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function omitUntrustedImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (imageTag) =>
    trustedImageUrl(imageSource(imageTag)) ? imageTag : '',
  );
}

/**
 * 비어 있지 않은 문자열일 때만 정화된 HTML을 돌려준다.
 *
 * `body_html`은 nullable 계약이다. null·undefined·공백만 있는 값은 "본문 없음"
 * 이지 "빈 본문"이 아니므로 null을 돌려주고, 호출부가 `bodyJson` 렌더링으로
 * 되돌아갈 수 있게 한다.
 */
export function sanitizeCmsHtml(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.trim()) return null;
  const sanitized = localizeLegacyAnchors(omitUntrustedImages(
    restoreSectionTags(sanitizeHtml(maskSectionTags(normalizeBold(value)))),
  ));
  const displayHtml = removeEmDashes(sanitized);
  return displayHtml.trim() ? displayHtml : null;
}

/**
 * ROOT-ADMIN의 HTML 가져오기용 정화기.
 *
 * 원문 class·id와 제한된 인라인 스타일을 남겨 가져온 문서의 레이아웃 의도를
 * 보존한다. 일반 CMS의 `body_html`에는 절대 쓰지 않는다. 이 경로도 실행 태그,
 * 이벤트 속성, JavaScript URL, CSS의 외부 리소스/표현식은 제거한다.
 */
export function sanitizeImportedCmsHtml(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (!value.trim()) return null;

  const sanitized = sanitizeHtmlLibrary(stripDangerousElementTokens(value), {
    allowedTags: IMPORTED_HTML_TAGS,
    allowedAttributes: IMPORTED_ALLOWED_ATTRIBUTES,
    // `true`는 타입상 가능하지만 현재 sanitize-html 런타임은 배열을 기대한다.
    allowedClasses: { '*': [/.*/] },
    allowedStyles: { '*': IMPORTED_ALLOWED_STYLES },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedSchemesAppliedToAttributes: ['href', 'src', 'xlink:href'],
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'object', 'embed', 'svg', 'math', 'template'],
  });
  const preserved = omitUntrustedImages(sanitized);
  const displayHtml = removeEmDashes(preserved);
  return displayHtml.trim() ? displayHtml : null;
}
