import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { fetchAllPosts, type CmsPostContent } from '@roottale/cms-client/server';
import { CONTENT_EDITING_CACHE_TAG } from '@roottale/cms-renderer-next/routes';
import { record, type ContentDocument, type SiteContent } from './bindings';
import { sharedModels } from './defaults';
export { CONTENT_EDITING_CACHE_TAG };
export function documentFromPost(post: CmsPostContent): ContentDocument | null {
  if (!sharedModels.some(model => model.key === post.modelKey) || !record(post.fields)) return null;
  const states = post.contentEditor?.sectionStates ?? {};
  return { id: post.id, modelKey: post.modelKey!, fields: post.fields,
    version: String(post.contentVersion ?? post.updatedAt), sectionStates: states };
}
// 모델별 성공 결과만 캐시한다. 인증값은 함수 안에서 읽어 캐시 키에 넣지 않는다.
const publishedDocument = unstable_cache(async (modelKey: string, baseUrl: string | undefined, siteId: string | undefined) => {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') throw new Error('공유 문서 읽기 키 없음');
  const posts = await fetchAllPosts({ apiKey, baseUrl, siteId, modelKey,
    limit: 2, maxPages: 1, cursorGuard: 'non-advancing', revalidate: 300, tags: [CONTENT_EDITING_CACHE_TAG] });
  // 공유 문서가 중복되면 임의의 값을 택하지 않는다.
  return posts.length === 1 ? documentFromPost(posts[0]!) : null;
}, ['madi-shared-content-v2'], { revalidate: 300, tags: [CONTENT_EDITING_CACHE_TAG] });
export const loadSiteContent = cache(async (): Promise<SiteContent> => {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return { documents: [] };
  const documents = await Promise.all(sharedModels.map(model =>
    publishedDocument(model.key, process.env.ROOTTALE_API_BASE, process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID)
      .catch(() => null),
  ));
  return { documents: documents.filter((document): document is ContentDocument => document !== null) };
});
