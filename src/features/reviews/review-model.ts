import { contentSource, type ContentSource } from '../cms/content-source';
import { selectRelatedPosts, type CmsPostContent } from '@roottale/cms-client/server';

import { firstBodyImageUrl } from '../cms/body-image';
import { removeEmDashes } from '../cms/content-text';
import { reviewsIndexMetadata, reviewTitleWithSuffix } from './review-content';

export const REVIEW_COLLECTION_KEY = 'reviews';
const REVIEWS_PER_PAGE = 10;

/** 주소 계산에 필요한 최소 글 — `path` 는 cms-client 가 내려주면(0.56+) 자동으로 채워진다. */
export type ReviewPathInput = Pick<CmsPostContent, 'slug'> & { readonly path?: string | null };

/**
 * 후기 상세 주소. 플랫폼이 저장한 정규 공개 경로(`post.path`, ADR-0105)를 먼저 읽고,
 * 없을 때(구 클라이언트·구 서버)만 `/reviews/{slug}` 로 조립한다.
 */
export function reviewEntryPath(post: ReviewPathInput): string {
  return typeof post.path === 'string' && post.path.startsWith('/')
    ? post.path
    : `/reviews/${encodeURIComponent(post.slug)}`;
}

export type ReviewMetadata = {
  copiedFrom?: ContentSource;
  patient: string | null;
  doctor: string | null;
  treatmentPeriod: string | null;
  category: string | null;
};

export type ReviewPage = {
  items: CmsPostContent[];
  page: number;
  pageCount: number;
  total: number;
};

const PATIENT_FIELD_NAMES = ['patient', 'patientName', 'patient_name', 'reviewer'];
const DOCTOR_FIELD_NAMES = ['doctor', 'doctorName', 'doctor_name', 'practitioner'];
const PERIOD_FIELD_NAMES = ['treatmentPeriod', 'treatment_period', 'period'];

function readStringField(
  fields: Record<string, unknown> | null,
  names: readonly string[],
): string | null {
  if (!fields) return null;
  for (const name of names) {
    const value = fields[name];
    if (typeof value === 'string' && value.trim()) return removeEmDashes(value.trim());
  }
  return null;
}

function reviewCategory(post: CmsPostContent): string | null {
  const category = post.terms.find((term) => term.taxonomy === 'category')?.name;
  return category ? removeEmDashes(category) : null;
}

export function reviewTitle(post: CmsPostContent): string {
  return removeEmDashes(post.title);
}

export function reviewExcerpt(post: CmsPostContent): string | null {
  return post.excerpt ? removeEmDashes(post.excerpt) : null;
}

export function reviewMetadata(post: CmsPostContent): ReviewMetadata {
  return {
    copiedFrom: contentSource(post.metaJson),
    patient: readStringField(post.fields, PATIENT_FIELD_NAMES),
    doctor:
      readStringField(post.fields, DOCTOR_FIELD_NAMES) ??
      (post.authorName ? removeEmDashes(post.authorName) : null),
    treatmentPeriod: readStringField(post.fields, PERIOD_FIELD_NAMES),
    category: reviewCategory(post),
  };
}

/** 상세 상단에 단독으로 둘 수 있는, 본문 첫머리의 후기 원문 이미지다. */
export function reviewLeadImageUrl(post: CmsPostContent): string | null {
  const content = post.bodyJson.content;
  const first = Array.isArray(content) ? content[0] : null;
  if (!first || typeof first !== 'object' || Reflect.get(first, 'type') !== 'image') return null;
  const attrs = Reflect.get(first, 'attrs');
  const src = attrs && typeof attrs === 'object' ? Reflect.get(attrs, 'src') : null;
  return typeof src === 'string' && src.trim() ? src : null;
}

export function reviewImageUrl(post: CmsPostContent): string | null {
  return post.featuredImageUrl ?? firstBodyImageUrl(post.bodyJson);
}

export function reviewCategories(posts: readonly CmsPostContent[]): string[] {
  return [
    ...new Set(
      posts.flatMap((post) => {
        const category = reviewCategory(post);
        return category ? [category] : [];
      }),
    ),
  ];
}

export function filterReviews(
  posts: readonly CmsPostContent[],
  category: string | null,
): CmsPostContent[] {
  if (!category) return [...posts];
  return posts.filter((post) => reviewCategory(post) === category);
}

export function paginateReviews(
  posts: readonly CmsPostContent[],
  requestedPage: number,
): ReviewPage {
  const pageCount = Math.max(1, Math.ceil(posts.length / REVIEWS_PER_PAGE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const start = (page - 1) * REVIEWS_PER_PAGE;
  return {
    items: posts.slice(start, start + REVIEWS_PER_PAGE),
    page,
    pageCount,
    total: posts.length,
  };
}

export function searchReviews(posts: readonly CmsPostContent[], query: string): CmsPostContent[] {
  const words = query.normalize('NFKC').toLocaleLowerCase('ko-KR').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...posts];
  return posts.filter((post) => {
    const text = [reviewTitle(post), reviewExcerpt(post), reviewCategory(post)]
      .filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase('ko-KR');
    return words.every((word) => text.includes(word));
  });
}

/**
 * 후기 상세 하단의 관련 후기. ROOT-ADMIN에서 고른 글이 있으면 그 순서를 정본으로
 * 사용하고, 선택이 비었을 때만 같은 분류의 최신 후기 3건을 자동 추천한다.
 */
export function relatedReviews(
  post: CmsPostContent,
  candidates: readonly CmsPostContent[],
): CmsPostContent[] {
  const selectedPosts = post.relatedPosts ?? [];
  if (selectedPosts.length === 0) {
    return selectRelatedPosts(post, [...candidates], 3);
  }

  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return selectedPosts.flatMap((selected) => {
    const candidate = candidatesById.get(selected.id);
    return candidate && candidate.id !== post.id ? [candidate] : [];
  });
}

export function parsePageNumber(value: string | null): number {
  if (!value) return 1;
  if (!/^\d+$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function reviewSeoDescription(post: CmsPostContent): string {
  const seo = post.metaJson.seo;
  if (seo && typeof seo === 'object') {
    const description = Reflect.get(seo, 'description');
    if (typeof description === 'string' && description.trim()) {
      return removeEmDashes(description.trim()).slice(0, 180);
    }
  }
  return (reviewExcerpt(post)?.trim() || reviewsIndexMetadata.description).slice(0, 180);
}

export function reviewSeoTitle(post: CmsPostContent): string {
  const seo = post.metaJson.seo;
  if (seo && typeof seo === 'object') {
    const title = Reflect.get(seo, 'title');
    if (typeof title === 'string' && title.trim()) return removeEmDashes(title.trim());
  }
  return reviewTitleWithSuffix(reviewTitle(post));
}

export function isReviewPost(value: unknown): value is CmsPostContent {
  if (!value || typeof value !== 'object') return false;
  return (
    Reflect.get(value, 'type') === 'post' &&
    Reflect.get(value, 'collectionKey') === REVIEW_COLLECTION_KEY &&
    typeof Reflect.get(value, 'id') === 'string' &&
    typeof Reflect.get(value, 'slug') === 'string'
  );
}
