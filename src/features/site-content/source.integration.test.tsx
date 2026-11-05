import '../../test-support/next-cache';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CmsPostContent } from '@roottale/cms-client/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { nextCacheFixture } from '../../test-support/next-cache';
import { reviewFixture } from '../reviews/review-fixture';
import MadiFooter from '../../components/madi/MadiFooter';
import { initialContent } from './fixtures';
import { loadSiteContent } from './source';
import { POST } from '../../app/api/revalidate/route';
const { readPosts } = vi.hoisted(() => ({ readPosts: vi.fn() }));
vi.mock('@roottale/cms-client/server', async original => ({ ...await original<typeof import('@roottale/cms-client/server')>(), fetchAllPosts: readPosts }));
vi.mock('@roottale/cms-client/webhook', () => ({ verifyRootTaleWebhook: async () => ({ ok: true, event: 'post.published', deliveryId: 'shared-fixture' }) }));
let runtime: ReturnType<typeof nextCacheFixture>;
let posts: CmsPostContent[];
beforeEach(() => {
  runtime = nextCacheFixture();
  vi.stubEnv('ROOTTALE_API_KEY','fixture-key'); vi.stubEnv('ROOTTALE_API_BASE','https://fixture.test');
  posts = initialContent().documents.map(doc => ({ ...reviewFixture(), id: doc.id, modelKey: doc.modelKey, fields: doc.fields }));
  readPosts.mockReset().mockImplementation(async ({ modelKey }: { modelKey: string }) => posts.filter(post => post.modelKey === modelKey));
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const read = () => runtime.request(() => loadSiteContent(), '/column/page');
test('공통 조회는 페이지별로 늘지 않고 공유 태그 발행 뒤 공개 HTML이 바뀐다', async () => {
  const first = await read(); expect(renderToStaticMarkup(<MadiFooter content={first} />)).toContain('madi2020@naver.com');
  await read(); expect(readPosts).toHaveBeenCalledTimes(4);
  const common = posts.find(post => post.modelKey === 'clinic-common')!;
  const shared = common.fields?.shared;
  if (!shared || typeof shared !== 'object') throw new Error('fixture shared 없음');
  const clinic = Reflect.get(shared,'clinic'); if (!clinic || typeof clinic !== 'object') throw new Error('fixture clinic 없음');
  Reflect.set(clinic,'email','changed@example.test');
  expect(renderToStaticMarkup(<MadiFooter content={await read()} />)).not.toContain('changed@example.test');
  const response = await runtime.request(() => POST(new Request('https://site.test/api/revalidate', { method: 'POST', body: JSON.stringify({ modelKey: 'clinic-common', paths: [] }) })), '/api/revalidate/route');
  expect(response.status).toBe(200);
  expect(renderToStaticMarkup(<MadiFooter content={await read()} />)).toContain('changed@example.test');
  expect(readPosts).toHaveBeenCalledTimes(8);
});
test('한 공유 문서의 실패·중복은 나머지 문서를 막지 않고 코드 기본값을 쓴다', async () => {
  readPosts.mockImplementation(async ({ modelKey }: { modelKey: string }) => {
    if (modelKey === 'column-footer') throw new Error('fixture unavailable');
    const selected = posts.filter(post => post.modelKey === modelKey);
    return modelKey === 'faq-footer' ? [...selected,...selected] : selected;
  });
  const content = await read();
  expect(content.documents.map(doc => doc.modelKey)).toEqual(['clinic-common','reviews-footer']);
  expect(renderToStaticMarkup(<MadiFooter content={content} />)).toContain('madi2020@naver.com');
});
test('API 키가 없으면 공개 API를 호출하지 않는다', async () => {
  vi.stubEnv('ROOTTALE_API_KEY',''); expect(await read()).toEqual({ documents: [] }); expect(readPosts).not.toHaveBeenCalled();
});

test('실패한 모델은 다음 요청에서 재조회하고 성공한 모델의 캐시는 유지한다', async () => {
  // 네 모델을 동시에 읽어 호출 순서가 일정하지 않다. 실패시킬 모델을 키로 고른다.
  let failed = false;
  readPosts.mockImplementation(async ({ modelKey }: { modelKey: string }) => {
    if (modelKey === 'clinic-common' && !failed) { failed = true; throw new Error('일시적 실패'); }
    return posts.filter(post => post.modelKey === modelKey);
  });
  const first = await read();
  expect(first.documents.some(doc => doc.modelKey === 'clinic-common')).toBe(false);
  const common = posts.find(post => post.modelKey === 'clinic-common')!;
  const shared = common.fields?.shared;
  if (!shared || typeof shared !== 'object') throw new Error('fixture shared 없음');
  const clinic = Reflect.get(shared, 'clinic');
  if (!clinic || typeof clinic !== 'object') throw new Error('fixture clinic 없음');
  Reflect.set(clinic, 'email', 'recovered@example.test');
  expect(renderToStaticMarkup(<MadiFooter content={await read()} />)).toContain('recovered@example.test');
  expect(readPosts).toHaveBeenCalledTimes(5);
});

test('unstable_cache 키에는 모델·공개 설정만 들어가고 API 키는 들어가지 않는다', async () => {
  const cacheKeys = vi.spyOn(runtime.cache, 'generateSimpleCacheKey');
  await read();
  expect(cacheKeys).toHaveBeenCalled();
  expect(JSON.stringify(cacheKeys.mock.calls)).not.toContain('fixture-key');
  expect(JSON.stringify(cacheKeys.mock.calls)).toContain('clinic-common');
});
