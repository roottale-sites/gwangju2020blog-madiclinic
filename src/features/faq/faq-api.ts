import { unstable_cache } from 'next/cache';

import {
  hasInternalContentLinkToken,
  internalContentLinkKeys,
} from '../cms/internal-content-links';
import { sanitizeCmsHtml } from '../cms/raw-html';
import { renderTiptapBody } from '../cms/tiptap-body';
import {
  FAQ_ALL_CACHE_TAG,
  FAQ_ARCHIVE_CACHE_TAG,
  FAQ_DATA_CACHE_TTL_SECONDS,
} from './faq-cache';
import {
  cleanFaqAnswer,
  cleanFaqQuestion,
  detailedFaqBodyHtml,
  FAQ_INTENTS,
  faqIntentForQuestion,
  faqPublishedInternalLinkPaths,
  faqRelatedContentIds,
  faqRelatedContentKeys,
  type FaqArchive,
  type FaqEntry,
} from './faq-model';
import { faqTaxonomyFromCategories, type FaqTaxonomy } from './faq-registry';
import {
  faqCategoryChain,
  fetchFaqCategories,
  fetchFaqModel,
  fetchFaqPostsPage,
  type FaqWireCategory,
  type FaqWireConfig,
  type FaqWirePost,
} from './faq-wire';

/**
 * FAQ 원장 조회. headnerve `features/faq/faq-api.ts`다.
 *
 * headnerve와 다르게 한 곳: 응답이 글 원장만이 아니라 분류 트리까지 함께 담는다
 * (`FaqCatalog`). headnerve는 트리를 코드(`faq-registry.ts`)에 갖고 있어서 글만
 * 받아 오면 됐다. 이 저장소는 트리도 CMS가 소유하므로(PLAN.md §4.2) 같은 요청·같은
 * 캐시 안에서 둘을 함께 읽어야 화면의 분류와 글이 갈라지지 않는다.
 */
export type FaqCatalog = {
  readonly archive: FaqArchive;
  readonly taxonomy: FaqTaxonomy;
};

export type FaqLoadFailure = 'unconfigured' | 'no-model' | 'upstream';

export type FaqLoadResult =
  | { ok: true; data: FaqCatalog }
  | { ok: false; reason: FaqLoadFailure };

const MAX_PAGES = 10;

type PreparedFaqPost = {
  post: FaqWirePost;
  sectionSlug: string;
  topicSlug: string;
  topicName: string;
  question: string;
  answer: string;
};

function cmsConfig(): FaqWireConfig | null {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return null;
  return {
    apiKey,
    baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
  };
}

/**
 * 캐시되는 fetcher는 비밀값을 인자로 받지 않는다 — `unstable_cache`가 인자에서
 * 캐시 키를 파생시키므로 API 키가 캐시 키 공간으로 들어간다. 공개 로더가 이미
 * 게이트를 통과시켰으므로 여기서는 설정이 반드시 존재한다(칼럼과 같은 규칙).
 */
function requireCmsConfig(): FaqWireConfig {
  const config = cmsConfig();
  if (!config) throw new Error('ROOTTALE_API_KEY 미설정');
  return config;
}

async function allPosts(): Promise<FaqWirePost[]> {
  const config = requireCmsConfig();
  const posts: FaqWirePost[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchFaqPostsPage(config, cursor);
    posts.push(...result.items);
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return posts;
}

/**
 * 글 하나를 네 단계 주소로 놓을 수 있는지 판정한다.
 *
 * 말단 2단계 분류가 정확히 하나 붙어 있고 질문·핵심 답변이 있어야 한다. 하나라도
 * 어긋나면 null이고 목록·사이트맵에서 빠진다 — 주소를 만들 수 없는 글이다.
 */
function prepareFaqPost(
  post: FaqWirePost,
  categories: readonly FaqWireCategory[],
  categoryDepth: number,
): PreparedFaqPost | null {
  const selectedCategories = post.terms.filter((term) => term.taxonomy === 'category');
  if (selectedCategories.length !== 1) return null;
  const chain = faqCategoryChain(selectedCategories[0]!.id, categories, categoryDepth);
  if (!chain || chain.length !== 2) return null;
  const [section, topicCategory] = chain;
  if (!section || !topicCategory) return null;
  if (!post.slug || !post.title || !post.excerpt || post.modelKey !== 'faq') return null;

  const question = cleanFaqQuestion(post.title);
  const answer = cleanFaqAnswer(post.excerpt);
  if (!question || !answer) return null;

  return {
    post,
    sectionSlug: section.slug,
    topicSlug: topicCategory.slug,
    topicName: topicCategory.name,
    question,
    answer,
  };
}

function entryFromPreparedPost(
  prepared: PreparedFaqPost,
  publishedInternalPaths: ReadonlyMap<string, string>,
): FaqEntry {
  const { post, sectionSlug, topicSlug, topicName, question, answer } = prepared;
  const renderedTiptap = renderTiptapBody(
    post.bodyJson,
    'faq-richtext',
    publishedInternalPaths,
  );
  const sanitizedHtml = hasInternalContentLinkToken(post.bodyJson)
    ? renderedTiptap
    : sanitizeCmsHtml(post.bodyHtml) ?? renderedTiptap;
  const reviewedAt = typeof post.fields.reviewed_at === 'string' && post.fields.reviewed_at.trim()
    ? post.fields.reviewed_at.trim()
    : undefined;
  const classification = typeof post.fields.classification === 'string' &&
    FAQ_INTENTS.includes(post.fields.classification as (typeof FAQ_INTENTS)[number])
    ? post.fields.classification as (typeof FAQ_INTENTS)[number]
    : faqIntentForQuestion(question);
  const displayOrder = typeof post.fields.display_order === 'number' && Number.isFinite(post.fields.display_order)
    ? post.fields.display_order
    : undefined;
  const clinicPerspectiveHtml = typeof post.fields.clinic_perspective === 'string'
    ? sanitizeCmsHtml(post.fields.clinic_perspective) ?? undefined
    : undefined;
  // 관련 콘텐츠 — 어드민 공통 패널(related_posts)이 정본. 옛 모델 필드(related_faqs)는
  // 이관 전 글을 위한 폴백이며 공통 패널에 고른 것이 있으면 무시한다.
  const relatedContentIds = post.relatedPostIds.length > 0
    ? post.relatedPostIds
    : faqRelatedContentIds(post.fields.related_faqs);
  const relatedContentKeys = faqRelatedContentKeys(post.fields.related_content_keys);
  const referencedContentKeys = internalContentLinkKeys(post.bodyJson);

  return {
    contentId: post.id || undefined,
    sectionSlug,
    topicSlug,
    topicName,
    slug: post.slug,
    path: post.path,
    question,
    answer,
    bodyHtml: detailedFaqBodyHtml(answer, sanitizedHtml),
    clinicPerspectiveHtml,
    previousSlugs: post.previousSlugs.length ? post.previousSlugs : undefined,
    relatedContentIds: relatedContentIds.length ? relatedContentIds : undefined,
    relatedContentKeys: relatedContentKeys.length ? relatedContentKeys : undefined,
    referencedContentKeys: referencedContentKeys.length ? referencedContentKeys : undefined,
    reviewedAt,
    displayOrder,
    intent: classification,
    source: 'cms',
    updatedAt: post.updatedAt,
  };
}

/**
 * 모델 계약이 맞지 않으면 null이다.
 *
 * `faq` 모델이 없거나 `basePath`·`categoryDepth`가 이 라우트(네 단계 `/faq`)와
 * 다르면 이 화면이 그 CMS를 표현할 수 없다. 빈 목록으로 내려보내면 "글이 없다"고
 * 잘못 알리게 되므로 `no-model`로 구분한다.
 */
async function fetchFaqCatalog(): Promise<FaqCatalog | null> {
  const config = requireCmsConfig();
  const [model, categories] = await Promise.all([
    fetchFaqModel(config),
    fetchFaqCategories(config),
  ]);
  if (!model || model.basePath !== '/faq' || model.categoryDepth !== 2) return null;
  const posts = await allPosts();
  const preparedPosts = posts.flatMap((post) => {
    const prepared = prepareFaqPost(post, categories, model.categoryDepth);
    return prepared ? [prepared] : [];
  });
  const publishedInternalPaths = faqPublishedInternalLinkPaths(preparedPosts.map((prepared) => ({
    sectionSlug: prepared.sectionSlug,
    topicSlug: prepared.topicSlug,
    slug: prepared.post.slug,
    path: prepared.post.path,
    previousSlugs: prepared.post.previousSlugs,
  })));
  return {
    archive: {
      source: 'cms',
      entries: preparedPosts
        .map((prepared) => entryFromPreparedPost(prepared, publishedInternalPaths))
        .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)),
    },
    taxonomy: faqTaxonomyFromCategories(categories),
  };
}

const loadCachedFaqCatalog = unstable_cache(
  fetchFaqCatalog,
  ['faq-catalog-v1'],
  {
    revalidate: FAQ_DATA_CACHE_TTL_SECONDS,
    tags: [FAQ_ALL_CACHE_TAG, FAQ_ARCHIVE_CACHE_TAG],
  },
);

/**
 * FAQ 원장과 분류 트리를 읽는다. 화면은 캐시본을 쓰고, 발행 웹훅처럼 "방금 발행된
 * 글"을 같은 요청 안에서 알아야 하는 곳만 `{ fresh: true }`로 CMS를 직접 읽는다 —
 * 캐시본의 관계 필드에는 발행 전 글이 빠져 있어 역참조 갱신 대상을 놓친다.
 */
export async function loadFaqCatalog(
  options: { readonly fresh?: boolean } = {},
): Promise<FaqLoadResult> {
  if (!cmsConfig()) return { ok: false, reason: 'unconfigured' };
  try {
    const data = options.fresh ? await fetchFaqCatalog() : await loadCachedFaqCatalog();
    return data ? { ok: true, data } : { ok: false, reason: 'no-model' };
  } catch (error) {
    console.error(JSON.stringify({
      message: 'RootTale FAQ CMS 요청 실패',
      error: error instanceof Error ? error.message : String(error),
    }));
    return { ok: false, reason: 'upstream' };
  }
}
