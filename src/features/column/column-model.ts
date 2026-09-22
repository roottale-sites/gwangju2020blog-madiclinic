import { siteUrl } from '../../data/site';
import { firstBodyImageUrl } from '../cms/body-image';
import { cfImageVariantUrl, isCfImageUrl } from '../cms/cf-image-url';
import { removeEmDashes } from '../cms/content-text';
import { sanitizeCmsHtml } from '../cms/raw-html';
import { renderTiptapBody } from '../cms/tiptap-body';
import type { ColumnArchivePost, ColumnPost } from './column-wire';
import { COLUMN_DESCRIPTION_MAX_LENGTH, columnSeoTitle } from './column-content';
import {
  columnCategoryRefFromTerms,
  nestedColumnEntryPath,
  type ColumnCategoryRef,
} from './column-category';

/** ROOT-ADMIN 콘텐츠 모델 키. `cms/content-models.json`의 `column`과 같아야 한다. */
export const COLUMN_COLLECTION_KEY = 'column';

/** 최소 입력 계약: `metaJson`(중첩 seo)과 `excerpt`만 읽는다. */
export type ColumnPostInput = Pick<ColumnPost, 'metaJson' | 'excerpt'>;

/**
 * 목록·상세가 함께 쓰는 표시 모델.
 *
 * headnerve는 이관 JSON 폴백과 CMS 글을 한 모양으로 정규화하느라 `source`를
 * 뒀다. 이 저장소의 출처는 CMS 하나뿐이라(PLAN.md §5.3) 그 필드를 두지 않는다.
 */
export type ColumnEntry = {
  /** ROOT-ADMIN 글 ID. 조회수 귀속(`rt:content-id`)에 쓴다. */
  contentId: string;
  copiedFrom?: { name: string; url: string };
  slug: string;
  /**
   * 플랫폼이 저장한 정규 공개 경로(ADR-0105). 링크·canonical·사이트맵·RSS가 이
   * 값을 읽고, 없을 때(구 서버)만 분류·slug로 조립한다.
   */
  path?: string | null;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  bodyHtml: string;
  bodyFormat: 'standard' | 'imported-html';
  /**
   * og:image·Article JSON-LD에 쓰는 절대 주소. 대표 이미지 → 본문 첫 사진 순이며,
   * 없으면 사이트 기본 OG 이미지를 상속한다.
   */
  shareImageUrl?: string;
  category: ColumnCategoryRef;
};

/** 목록과 XML 사이트맵에 필요한 본문 없는 칼럼 요약 모델. */
export type ColumnArchiveEntry = Pick<
  ColumnEntry,
  'slug' | 'path' | 'title' | 'description' | 'publishedAt' | 'updatedAt' | 'category' | 'copiedFrom'
> & {
  /** CMS 대표 이미지. 목록 도판과 RSS enclosure가 쓴다. */
  featuredImageUrl?: string;
};

/**
 * 공유 이미지는 본문 이미지와 같은 신뢰 정책을 지킨다. Cloudflare Images면 미리보기
 * 카드가 요구하는 1200px 이상을 위해 `lg`를 쓰고, 사이트 상대 경로는 절대 주소로 편다.
 */
function columnShareImageUrl(post: ColumnPost): string | undefined {
  const candidate = post.featuredImageUrl ?? firstBodyImageUrl(post.bodyJson);
  if (!candidate) return undefined;

  if (isCfImageUrl(candidate)) return cfImageVariantUrl(candidate, 'lg');
  return candidate.startsWith('/') ? siteUrl(candidate) : candidate;
}

export function isColumnPost(
  value: unknown,
): value is Pick<ColumnPost, 'type' | 'collectionKey' | 'id' | 'slug'> {
  if (!value || typeof value !== 'object') return false;
  return (
    Reflect.get(value, 'type') === 'post' &&
    Reflect.get(value, 'collectionKey') === COLUMN_COLLECTION_KEY &&
    typeof Reflect.get(value, 'id') === 'string' &&
    typeof Reflect.get(value, 'slug') === 'string'
  );
}

function seoString(post: ColumnPostInput, key: 'title' | 'description'): string | null {
  const seo = post.metaJson.seo;
  if (seo && typeof seo === 'object') {
    const value = Reflect.get(seo, key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function columnPostDescription(post: ColumnPostInput): string {
  // `?? `는 빈 문자열을 통과시키므로, 공백만 들어있는 excerpt를 먼저 null로
  // 낮춰야 기본 문구까지 내려간다(위 `seoString`과 같은 판정).
  return removeEmDashes(
    seoString(post, 'description') ??
      (post.excerpt?.trim() ||
        '광주 남구 마디클리닉 이경무 대표원장이 쓰는 통증·비수술 치료 칼럼입니다.'),
  ).slice(0, COLUMN_DESCRIPTION_MAX_LENGTH);
}

/**
 * CMS 글 → 표시 모델.
 *
 * 본문 우선순위: 서버가 준 `bodyHtml`이 비어 있지 않으면 그것을 쓰고, 없으면
 * `bodyJson`을 화이트리스트 렌더러로 그린다. `body_html`이 nullable인 동안 두
 * 경로가 모두 살아 있어야 하므로 폴백을 지우지 않는다.
 *
 * 분류가 정확히 하나가 아니면 주소를 만들 수 없어 null이다(호출부가 제외한다).
 */
function copiedFrom(post: ColumnPostInput): ColumnEntry['copiedFrom'] {
  const source = post.metaJson.copiedFrom;
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

export function columnEntryFromPost(post: ColumnPost): ColumnEntry | null {
  const category = columnCategoryRefFromTerms(post.terms);
  if (!category) return null;

  const bodyHtml = sanitizeCmsHtml(post.bodyHtml) ?? renderTiptapBody(post.bodyJson, 'column-richtext');

  return {
    contentId: post.id,
    slug: post.slug,
    path: post.path,
    title: removeEmDashes(post.title),
    description: columnPostDescription(post),
    copiedFrom: copiedFrom(post),
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt ?? post.publishedAt,
    bodyHtml: bodyHtml ?? '',
    bodyFormat: 'standard',
    ...(columnShareImageUrl(post) ? { shareImageUrl: columnShareImageUrl(post) } : {}),
    category,
  };
}

export function columnArchiveEntryFromPost(post: ColumnArchivePost): ColumnArchiveEntry | null {
  const category = columnCategoryRefFromTerms(post.terms);
  if (!category) return null;

  return {
    slug: post.slug,
    path: post.path,
    title: removeEmDashes(post.title),
    description: columnPostDescription(post),
    copiedFrom: copiedFrom(post),
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt ?? post.publishedAt,
    ...(post.featuredImageUrl ? { featuredImageUrl: post.featuredImageUrl } : {}),
    category,
  };
}

/**
 * 칼럼 상세 주소. 플랫폼 원장(`entry.path`)을 먼저 읽고, 없을 때만 분류·slug로
 * 조립한다(ADR-0105 Amendment 1 — FRONT는 주소를 다시 계산하지 않는다).
 */
export function columnEntryPath(entry: Pick<ColumnEntry, 'slug' | 'category' | 'path'>): string {
  return entry.path ?? nestedColumnEntryPath(entry.category.slug, entry.slug);
}

export function columnEntrySeoTitle(entry: Pick<ColumnEntry, 'title'>): string {
  return columnSeoTitle(entry);
}

export function sortColumnEntries<T extends Pick<ColumnEntry, 'publishedAt'>>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
