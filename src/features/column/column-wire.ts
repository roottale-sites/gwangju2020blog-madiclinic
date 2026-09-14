/**
 * 칼럼 전용 공개 API 와이어 클라이언트.
 *
 * **왜 공용 클라이언트를 그대로 쓰지 않는가.** `@roottale/cms-client`(0.52·0.53)의
 * `fromWire`는 화이트리스트 객체 리터럴이라 서버가 새로 내려주는 `body_html`을
 * 매핑 단계에서 버린다. 소비자 쪽 타입을 아무리 넓혀도 값 자체가 이미 없으므로
 * 복구할 수 없다. 그래서 칼럼 경로에만 최소한의 와이어 조회를 둔다.
 *
 * **공용 클라이언트의 계약을 그대로 지킨다.** 아래는 전부 의도적으로 같게 맞춘
 * 것이고, 하나라도 어긋나면 폴백 경계나 인증이 조용히 달라진다.
 * - 인증 헤더(`Bearer` + `x-roottale-client`)와 서버 전용 가드
 * - 상세 404 → `null`(권위 있는 부재), 그 외 비정상 응답 → throw(장애)
 * - `limit`·`cursor`·`type`·`collection_key`·`locale` 질의 파라미터 이름
 * - 페이지 응답의 `items`·`has_more`·`next_cursor`
 *
 * 클라이언트가 `body_html`을 내보내는 버전이 나오면 이 파일을 지우고
 * `fetchPosts`·`fetchPost`로 되돌리면 된다.
 */

/**
 * 칼럼 표시에 실제로 쓰는 필드만 담은 글.
 *
 * 전체 `CmsPostContent`를 흉내 내지 않는다. 쓰지 않는 필드까지 매핑하면 서버
 * 계약이 바뀔 때마다 여기가 함께 깨지는데, 칼럼은 아래 필드만 소비한다.
 */
export type ColumnPost = {
  id: string;
  type: string;
  collectionKey: string | null;
  slug: string;
  /**
   * 플랫폼이 저장한 정규 공개 경로(ADR-0105, 예 `/column/headache/{slug}`).
   * 상세 주소가 없는 글은 null, 구 서버는 미포함.
   */
  path?: string | null;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  updatedAt?: string;
  featuredImageUrl?: string | null;
  bodyJson: Record<string, unknown>;
  /** 서버가 만든 원본 HTML. 살균되지 않은 상태로 오며, 없으면 null. */
  bodyHtml: string | null;
  metaJson: Record<string, unknown>;
  terms: ColumnTerm[];
};

export type ColumnTerm = {
  taxonomy: string;
  slug: string;
  name: string;
};

export type ColumnCategoryWire = {
  slug: string;
  name: string;
  publishedPostCount: number;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  path: string | null;
};

/**
 * 칼럼 목록·사이트맵이 쓰는 최소 CMS 응답.
 *
 * 전체 본문은 상세 경로에서만 필요하다. 목록 캐시에 본문까지 넣으면 글이 늘수록
 * `body_html`/`body_json`이 Next Data Cache 2MB 한도를 넘어, 목록과 사이트맵이
 * 매 빌드마다 캐시 미스로 시작한다.
 */
export type ColumnArchivePost = Pick<
  ColumnPost,
  'slug' | 'path' | 'title' | 'excerpt' | 'publishedAt' | 'updatedAt' | 'featuredImageUrl' | 'metaJson' | 'terms'
>;

function archiveSeoMeta(metaJson: Record<string, unknown>): Record<string, unknown> {
  const seo = metaJson.seo;
  const title = isRecord(seo) && typeof seo.title === 'string' ? seo.title : undefined;
  const description = isRecord(seo) && typeof seo.description === 'string' ? seo.description : undefined;

  // 목록 캐시에는 SEO 두 값만 남긴다. 나머지 메타데이터는 화면이 쓰지 않으므로
  // 캐시 용량과 비공개 메타데이터 노출을 함께 막는다.
  return title === undefined && description === undefined
    ? {}
    : {
        seo: {
          ...(title === undefined ? {} : { title }),
          ...(description === undefined ? {} : { description }),
        },
      };
}

export function columnArchivePost(post: ColumnPost): ColumnArchivePost {
  return {
    slug: post.slug,
    path: post.path,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt ?? post.publishedAt,
    featuredImageUrl: post.featuredImageUrl,
    metaJson: archiveSeoMeta(post.metaJson),
    terms: post.terms,
  };
}

export type ColumnWireConfig = {
  apiKey: string;
  baseUrl: string;
};

type WirePost = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 저장된 공개 경로는 사이트 상대 절대 경로(`/`로 시작)일 때만 믿는다. */
function publicPath(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') ? value : null;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

/**
 * 브라우저에서 부르면 API 키가 번들에 실린다. 공용 클라이언트와 같은 이유로
 * 실행 자체를 막는다(ADR-0023 §5.1 #15).
 */
function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      '칼럼 CMS 와이어 조회는 서버에서만 실행해야 한다. API 키가 브라우저로 새면 보안 모델이 무너진다.',
    );
  }
}

/**
 * 와이어 글 → 표시용 글.
 *
 * `body_html`이 이 매핑의 존재 이유다. nullable 계약이므로 문자열이 아니면
 * null로 낮춰 호출부가 `bodyJson`으로 되돌아갈 수 있게 한다.
 */
export function columnPostFromWire(wire: WirePost): ColumnPost {
  return {
    id: stringOr(wire.id, ''),
    type: stringOr(wire.type, ''),
    collectionKey: nullableString(wire.collection_key),
    slug: stringOr(wire.slug, ''),
    path: publicPath(wire.path),
    title: stringOr(wire.title, ''),
    excerpt: nullableString(wire.excerpt),
    publishedAt: stringOr(wire.published_at, ''),
    updatedAt: stringOr(wire.updated_at, stringOr(wire.published_at, '')),
    // 공개 API는 대표 이미지를 `featured_media_url`(Cloudflare Images 주소)로
    // 내려준다. `featured_image_url`은 공용 클라이언트 초기 계약의 이름이라
    // 호환용으로만 뒤에 둔다. 이름을 잘못 읽으면 목록 썸네일이 조용히 비어 버린다.
    featuredImageUrl: nullableString(wire.featured_media_url) ?? nullableString(wire.featured_image_url),
    bodyJson: record(wire.body_json),
    bodyHtml: nullableString(wire.body_html),
    metaJson: record(wire.meta_json),
    terms: Array.isArray(wire.terms)
      ? wire.terms.flatMap((term) => {
          if (!isRecord(term)) return [];
          const taxonomy = stringOr(term.taxonomy, '');
          const slug = stringOr(term.slug, '');
          const name = stringOr(term.name, '');
          return taxonomy && slug && name ? [{ taxonomy, slug, name }] : [];
        })
      : [],
  };
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    authorization: `Bearer ${apiKey}`,
    'x-roottale-client': 'madiclinic-column/1',
  };
}

function postsUrl(config: ColumnWireConfig, params: URLSearchParams, path = ''): string {
  const base = config.baseUrl.replace(/\/+$/, '');
  const qs = params.toString();
  return `${base}/v1/cms/public/posts${path}${qs ? `?${qs}` : ''}`;
}

async function upstreamError(response: Response): Promise<Error> {
  let message = `RootTale CMS API error: ${response.status}`;
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.message === 'string') message = body.message;
  } catch {
    // 본문이 JSON이 아니어도 상태 코드만으로 충분하다.
  }
  return new Error(message);
}

export type ColumnWirePage = {
  items: ColumnPost[];
  hasMore: boolean;
  nextCursor: string | null;
};

/** 목록 한 페이지. 실패는 throw로 알리고 호출부가 폴백 사유로 바꾼다. */
export async function fetchColumnPostsPage(
  config: ColumnWireConfig,
  options: { collectionKey: string; limit: number; cursor?: string; locale?: string },
): Promise<ColumnWirePage> {
  assertServerOnly();

  const params = new URLSearchParams();
  params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);
  params.set('type', 'post');
  params.set('collection_key', options.collectionKey);
  if (options.locale) params.set('locale', options.locale);

  const response = await fetch(postsUrl(config, params), {
    method: 'GET',
    headers: authHeaders(config.apiKey),
  });
  if (!response.ok) throw await upstreamError(response);

  const json: unknown = await response.json();
  const items = isRecord(json) && Array.isArray(json.items) ? json.items : [];
  return {
    items: items.filter(isRecord).map(columnPostFromWire),
    hasMore: isRecord(json) ? json.has_more === true : false,
    nextCursor: isRecord(json) ? nullableString(json.next_cursor) : null,
  };
}

/**
 * 글 하나. 404는 "없는 글"이라는 권위 있는 답이므로 null이고, 그 밖의 실패만
 * 예외로 올린다. 이 구분이 폴백 경계를 지탱한다.
 */
export async function fetchColumnPostBySlug(
  config: ColumnWireConfig,
  slugOrId: string,
  options: { locale?: string } = {},
): Promise<ColumnPost | null> {
  assertServerOnly();

  const params = new URLSearchParams();
  if (options.locale) params.set('locale', options.locale);

  const url = postsUrl(config, params, `/${encodeURIComponent(slugOrId)}`);
  const response = await fetch(url, { method: 'GET', headers: authHeaders(config.apiKey) });
  if (response.status === 404) return null;
  if (!response.ok) throw await upstreamError(response);

  const json: unknown = await response.json();
  return isRecord(json) ? columnPostFromWire(json) : null;
}

/** 만료된 미리보기 링크(410 `preview_expired`). 호출부가 "다시 열어 달라"고 안내한다. */
export class ColumnPreviewExpiredError extends Error {
  constructor() {
    super('미리보기 링크가 만료됐다');
    this.name = 'ColumnPreviewExpiredError';
  }
}

export type ColumnPreviewPost = ColumnPost & {
  preview: { expiresAt: string; sourceStatus: string };
};

/**
 * ROOT-ADMIN 편집기가 발급한 미리보기 토큰으로 편집 중인 글을 받는다
 * (`GET /v1/cms/public/posts/preview?token=`, ADR-0104). 응답은 발행 글과 같은
 * 형식 + `preview` 블록이라 `columnPostFromWire`를 그대로 쓴다.
 *
 * - 400(토큰 형식 불일치)·404(없는·다른 사이트 토큰) → null, 410(만료) →
 *   ColumnPreviewExpiredError, 그 외 비정상 → throw.
 *   토큰은 주소 질의값이라 아무 문자열이나 들어온다. 형식 검증 실패는 "쓸 수 없는
 *   토큰"이지 장애가 아니므로, 없는 토큰과 같이 404 화면으로 보낸다.
 *   캐시는 절대 하지 않는다(`cache: 'no-store'`).
 */
export async function fetchColumnPostPreview(
  config: ColumnWireConfig,
  token: string,
): Promise<ColumnPreviewPost | null> {
  assertServerOnly();
  const trimmed = token.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({ token: trimmed });
  const url = postsUrl(config, params, '/preview');
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(config.apiKey),
    cache: 'no-store',
  });
  if (response.status === 400 || response.status === 404) return null;
  if (response.status === 410) throw new ColumnPreviewExpiredError();
  if (!response.ok) throw await upstreamError(response);

  const json: unknown = await response.json();
  if (!isRecord(json)) return null;
  const preview = record(json.preview);
  return {
    ...columnPostFromWire(json),
    preview: {
      expiresAt: stringOr(preview.expires_at, ''),
      sourceStatus: stringOr(preview.source_status, 'draft'),
    },
  };
}

export async function fetchColumnCategories(
  config: ColumnWireConfig,
  collectionKey: string,
): Promise<ColumnCategoryWire[]> {
  assertServerOnly();
  const base = config.baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams({ collection_key: collectionKey });
  const response = await fetch(`${base}/v1/cms/public/categories?${params}`, {
    method: 'GET',
    headers: authHeaders(config.apiKey),
  });
  if (!response.ok) throw await upstreamError(response);

  const json: unknown = await response.json();
  const categories = isRecord(json) && Array.isArray(json.categories) ? json.categories : null;
  if (!categories) throw new Error('RootTale CMS categories 응답에 categories 배열이 없습니다.');

  return categories.flatMap((category) => {
    if (!isRecord(category)) return [];
    // 공개 API가 collection_key 필터를 무시해 다른 콘텐츠 유형과 공통 분류까지
    // 함께 내려주는 경우가 있다. 소비자 경계에서 요청한 컬렉션만 다시 고정한다.
    if (category.collection_key !== collectionKey) return [];
    const slug = stringOr(category.slug, '');
    const name = stringOr(category.name, '');
    if (!slug || !name) return [];
    const count = category.published_post_count;
    return [{
      slug,
      name,
      publishedPostCount: typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : 0,
      description: nullableString(category.description),
      seoTitle: nullableString(category.seo_title),
      seoDescription: nullableString(category.seo_description),
      path: nullableString(category.path),
    }];
  });
}
