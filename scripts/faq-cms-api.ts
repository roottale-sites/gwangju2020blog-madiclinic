/**
 * ROOT-ADMIN 관리 API 공용 클라이언트 — FAQ 이관·시트 가져오기 스크립트가 함께 쓴다.
 * 서버 전용 API 키(ROOTTALE_API_KEY)와 site_id를 환경변수·인자로 받는다.
 */
/**
 * 형태 타입은 headnerve `features/faq/{faq-import,faq-wire}.ts`와 같다. FAQ 기능
 * 자체는 7단계에서 들어오므로, 그때 이 선언을 해당 모듈 import로 되돌린다.
 */
export type FaqWireConfig = { apiKey: string; baseUrl: string };

export type ManagedFaqPost = {
  id: string;
  slug: string;
  status: string;
  title: string;
  excerpt: string | null;
  bodyJson: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  categoryIds: readonly string[];
};

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function recordValue(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function config(): FaqWireConfig {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey) throw new Error('ROOTTALE_API_KEY가 필요합니다');
  return {
    apiKey,
    baseUrl: (process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com').replace(/\/+$/u, ''),
  };
}

export function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() || undefined : undefined;
}

export function siteId(): string | undefined {
  return option('--site-id') ?? (process.env.ROOTTALE_SITE_ID?.trim() || undefined);
}

export function authorProfileId(): string | undefined {
  return option('--author-profile-id') ??
    (process.env.ROOTTALE_FAQ_AUTHOR_PROFILE_ID?.trim() || undefined);
}

export function url(path: string, params?: URLSearchParams): string {
  const query = params?.toString();
  return `${config().baseUrl}${path}${query ? `?${query}` : ''}`;
}

export async function request(path: string, init?: RequestInit, params?: URLSearchParams): Promise<unknown> {
  const response = await fetch(url(path, params), {
    ...init,
    headers: {
      authorization: `Bearer ${config().apiKey}`,
      'content-type': 'application/json',
      'x-roottale-client': 'madiclinic-faq-import/1',
      ...init?.headers,
    },
  });
  if (response.ok) return response.json();
  const body = await response.text();
  throw new Error(`RootTale API ${response.status}: ${body.slice(0, 500)}`);
}

export function withSite(params = new URLSearchParams()): URLSearchParams {
  const id = siteId();
  if (id) params.set('site_id', id);
  return params;
}

export function bodyWithSite(body: JsonRecord = {}): JsonRecord {
  const id = siteId();
  return id ? { ...body, site_id: id } : body;
}

export async function fetchApiScopes(): Promise<Set<string>> {
  const json = await request('/v1/me');
  if (!isRecord(json) || !Array.isArray(json.scopes)) throw new Error('API key 범위를 확인할 수 없습니다');
  return new Set(json.scopes.filter((value): value is string => typeof value === 'string'));
}

export function assertApiScopes(scopes: ReadonlySet<string>, required: readonly string[]): void {
  const missing = required.filter((scope) => !scopes.has(scope));
  if (missing.length > 0) throw new Error(`API key 권한이 부족합니다: ${missing.join(', ')}`);
}

export async function fetchManagedFaqPosts(): Promise<ManagedFaqPost[]> {
  const posts: ManagedFaqPost[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const params = withSite(new URLSearchParams({ limit: '100', model_key: 'faq' }));
    if (cursor) params.set('cursor', cursor);
    const json = await request('/v1/cms/posts', undefined, params);
    if (!isRecord(json) || !Array.isArray(json.items)) throw new Error('FAQ 관리 글 응답 형식이 올바르지 않습니다');
    for (const value of json.items) {
      if (!isRecord(value)) continue;
      const id = stringValue(value.id);
      const slug = stringValue(value.slug);
      if (!id || !slug) continue;
      const terms = Array.isArray(value.terms) ? value.terms : [];
      posts.push({
        id,
        slug,
        status: stringValue(value.status),
        title: stringValue(value.title),
        excerpt: typeof value.excerpt === 'string' ? value.excerpt : null,
        bodyJson: recordValue(value.body_json),
        fieldValues: recordValue(value.field_values),
        categoryIds: terms.flatMap((term) =>
          isRecord(term) && term.taxonomy === 'category' && typeof term.id === 'string' ? [term.id] : []),
      });
    }
    if (json.has_more !== true || typeof json.next_cursor !== 'string') break;
    cursor = json.next_cursor;
  }
  return posts;
}

export async function publish(post: ManagedFaqPost): Promise<void> {
  await request(`/v1/cms/posts/${encodeURIComponent(post.id)}/publish`, {
    method: 'POST',
    body: JSON.stringify(bodyWithSite()),
  });
}

export async function clearLegacyDuplicatedBody(post: ManagedFaqPost): Promise<void> {
  await request(`/v1/cms/posts/${encodeURIComponent(post.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(bodyWithSite({
      body_json: { type: 'doc', content: [] },
    })),
  });
}

export async function rollbackCreated(posts: readonly ManagedFaqPost[]): Promise<void> {
  for (const post of [...posts].reverse()) {
    try {
      await request(
        `/v1/cms/posts/${encodeURIComponent(post.id)}`,
        { method: 'DELETE' },
        withSite(new URLSearchParams({ hard: 'true' })),
      );
    } catch (error) {
      console.error(`롤백 실패: ${post.slug} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

