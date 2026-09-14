/**
 * FAQ 전용 공개 API 와이어 클라이언트. headnerve `features/faq/faq-wire.ts`다.
 *
 * 칼럼(`column-wire.ts`)과 같은 이유로 공용 클라이언트를 쓰지 않는다 — `body_html`과
 * 관계 필드(`related_posts`), 분류의 부모 관계(`parent_id`)가 공용 매핑에서 사라진다.
 *
 * headnerve와 다르게 한 곳
 *   - 분류 응답에서 `description`·`seo_title`·`seo_description`도 읽는다. 진료 영역·
 *     세부 질환의 이름과 문구는 전부 CMS에서 와야 하고(PLAN.md §4.2), headnerve는
 *     그 문구를 `faq-registry.ts`의 정적 표에 갖고 있었다.
 *   - `x-roottale-client`를 이 사이트 이름으로 바꿨다.
 */
export type FaqWireConfig = { apiKey: string; baseUrl: string };

export type FaqWireTerm = {
  id: string;
  taxonomy: string;
  slug: string;
  name: string;
};

export type FaqWireCategory = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  collectionKey: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type FaqWireModel = {
  key: 'faq';
  basePath: string;
  categoryDepth: number;
};

export type FaqWirePost = {
  id: string;
  modelKey: string;
  collectionKey: string;
  slug: string;
  /** 옛 slug 목록(최신순). 구 서버는 미포함. */
  previousSlugs: readonly string[];
  /**
   * 플랫폼이 저장한 정규 공개 경로(ADR-0105, 예 `/faq/{section}/{topic}/{slug}`).
   * 상세 주소가 없는 글은 null, 구 서버는 미포함(null).
   */
  path: string | null;
  title: string;
  excerpt: string | null;
  updatedAt: string;
  bodyJson: Record<string, unknown>;
  bodyHtml: string | null;
  fields: Record<string, unknown>;
  terms: readonly FaqWireTerm[];
  /**
   * 관련 콘텐츠(어드민 공통 패널, 유형 무관) — 공개 API `related_posts`의 글 id,
   * 고른 순서, 발행 글만. 구 서버·옛 캐시본은 빈 배열.
   */
  relatedPostIds: readonly string[];
};

export type FaqWirePage = {
  items: readonly FaqWirePost[];
  hasMore: boolean;
  nextCursor: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** 저장된 공개 경로는 사이트 상대 절대 경로(`/`로 시작)일 때만 믿는다. */
function publicPath(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') ? value : null;
}

function recordValue(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    authorization: `Bearer ${apiKey}`,
    'x-roottale-client': 'madiclinic-faq/1',
  };
}

function assertServerOnly(): void {
  if (typeof window !== 'undefined') throw new Error('FAQ CMS 조회는 서버에서만 실행해야 합니다.');
}

function apiUrl(config: FaqWireConfig, path: string, params?: URLSearchParams): string {
  const query = params?.toString();
  return `${config.baseUrl.replace(/\/+$/u, '')}${path}${query ? `?${query}` : ''}`;
}

async function upstreamError(response: Response): Promise<Error> {
  let message = `RootTale CMS API error: ${response.status}`;
  try {
    const json: unknown = await response.json();
    if (isRecord(json) && typeof json.message === 'string') message = json.message;
  } catch {
    // 상태 코드만으로 실패 경계를 유지한다.
  }
  return new Error(message);
}

async function getJson(config: FaqWireConfig, path: string, params?: URLSearchParams): Promise<unknown> {
  assertServerOnly();
  const response = await fetch(apiUrl(config, path, params), {
    headers: authHeaders(config.apiKey),
  });
  if (!response.ok) throw await upstreamError(response);
  return response.json();
}

export async function fetchFaqModel(config: FaqWireConfig): Promise<FaqWireModel | null> {
  const json = await getJson(config, '/v1/cms/public/content-models');
  const models = isRecord(json) && Array.isArray(json.models) ? json.models : [];
  for (const value of models) {
    if (!isRecord(value) || value.key !== 'faq' || !isRecord(value.presentation)) continue;
    const presentation = value.presentation;
    if (
      presentation.kind !== 'category_tree' ||
      typeof presentation.basePath !== 'string' ||
      typeof presentation.categoryDepth !== 'number'
    ) continue;
    return {
      key: 'faq',
      basePath: presentation.basePath,
      categoryDepth: presentation.categoryDepth,
    };
  }
  return null;
}

export async function fetchFaqCategories(config: FaqWireConfig): Promise<FaqWireCategory[]> {
  const params = new URLSearchParams({ collection_key: 'faq' });
  const json = await getJson(config, '/v1/cms/public/categories', params);
  const categories = isRecord(json) && Array.isArray(json.categories) ? json.categories : [];
  return categories.flatMap((value) => {
    if (!isRecord(value)) return [];
    const id = stringValue(value.id);
    const slug = stringValue(value.slug);
    const name = stringValue(value.name);
    const collectionKey = nullableString(value.collection_key);
    // 공개 API가 collection_key 필터를 무시해 다른 유형의 분류까지 내려주는 경우가
    // 있다. 소비자 경계에서 요청한 컬렉션만 다시 고정한다(칼럼과 같은 판정).
    if (!id || !slug || !name || collectionKey !== 'faq') return [];
    return [{
      id,
      parentId: nullableString(value.parent_id),
      slug,
      name,
      collectionKey,
      description: nullableString(value.description),
      seoTitle: nullableString(value.seo_title),
      seoDescription: nullableString(value.seo_description),
    }];
  });
}

function postFromWire(value: Record<string, unknown>): FaqWirePost {
  const publishedAt = stringValue(value.published_at);
  return {
    id: stringValue(value.id),
    modelKey: stringValue(value.model_key),
    collectionKey: stringValue(value.collection_key),
    slug: stringValue(value.slug),
    previousSlugs: Array.isArray(value.previous_slugs)
      ? value.previous_slugs.filter((slug): slug is string => typeof slug === 'string' && slug !== '')
      : [],
    path: publicPath(value.path),
    title: stringValue(value.title),
    excerpt: nullableString(value.excerpt),
    updatedAt: stringValue(value.updated_at) || publishedAt || new Date(0).toISOString(),
    bodyJson: recordValue(value.body_json),
    bodyHtml: nullableString(value.body_html),
    fields: recordValue(value.fields),
    relatedPostIds: Array.isArray(value.related_posts)
      ? value.related_posts.flatMap((item) =>
          isRecord(item) && typeof item.id === 'string' && item.id ? [item.id] : [],
        )
      : [],
    terms: Array.isArray(value.terms)
      ? value.terms.flatMap((term) => {
          if (!isRecord(term)) return [];
          const id = stringValue(term.id);
          const taxonomy = stringValue(term.taxonomy);
          const slug = stringValue(term.slug);
          const name = stringValue(term.name);
          return id && taxonomy && slug && name ? [{ id, taxonomy, slug, name }] : [];
        })
      : [],
  };
}

export async function fetchFaqPostsPage(
  config: FaqWireConfig,
  cursor?: string,
): Promise<FaqWirePage> {
  const params = new URLSearchParams({ limit: '100', type: 'post', model_key: 'faq' });
  if (cursor) params.set('cursor', cursor);
  const json = await getJson(config, '/v1/cms/public/posts', params);
  const items = isRecord(json) && Array.isArray(json.items) ? json.items : [];
  return {
    items: items.filter(isRecord).map(postFromWire),
    hasMore: isRecord(json) && json.has_more === true,
    nextCursor: isRecord(json) ? nullableString(json.next_cursor) : null,
  };
}

/**
 * 글이 고른 말단 분류에서 `depth`단계 분류 사슬을 계산한다.
 *
 * 부모를 고른 글(사슬 길이 1)이나 자식을 가진 분류는 말단이 아니므로 null이다 —
 * 그 글은 네 단계 주소를 가질 수 없고, 목록·사이트맵에서 빠진다.
 */
export function faqCategoryChain(
  leafId: string,
  categories: readonly FaqWireCategory[],
  depth: number,
): FaqWireCategory[] | null {
  const byId = new Map(categories.map((category) => [category.id, category]));
  if (byId.size !== categories.length || categories.some((category) => category.parentId === leafId)) return null;
  const reversed: FaqWireCategory[] = [];
  const visited = new Set<string>();
  let currentId: string | null = leafId;
  while (currentId) {
    if (visited.has(currentId)) return null;
    visited.add(currentId);
    const current = byId.get(currentId);
    if (!current) return null;
    reversed.push(current);
    currentId = current.parentId;
  }
  return reversed.length === depth ? reversed.reverse() : null;
}
