import { cache } from 'react';
import { CmsApiError, fetchPostPreview, isPreviewExpiredError, type CmsPostPreviewContent } from '@roottale/cms-client/server';

type PreviewLookup =
  | { kind: 'post'; post: CmsPostPreviewContent }
  | { kind: 'missing' | 'expired' | 'unavailable' | 'unsupported' };

/** ID 검증까지 묶어 metadata와 화면이 같은 초안을 읽는다. 초안은 영속 캐시에 넣지 않는다. */
export const loadPostPreview = cache(async (postId: string, token: string): Promise<PreviewLookup> => {
  if (!token.trim()) return { kind: 'missing' };
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return { kind: 'unavailable' };
  try {
    const post = await fetchPostPreview({
      apiKey, token, baseUrl: process.env.ROOTTALE_API_BASE?.trim() || undefined,
    });
    if (!post || post.id !== postId) return { kind: 'missing' };
    if (post.type !== 'post' || !['column', 'reviews', 'faq'].includes(post.collectionKey ?? '') ||
      (post.modelKey && post.modelKey !== post.collectionKey)) return { kind: 'unsupported' };
    return { kind: 'post', post };
  } catch (error) {
    if (isPreviewExpiredError(error)) return { kind: 'expired' };
    if (error instanceof CmsApiError && [400, 401, 403, 404].includes(error.status)) return { kind: 'missing' };
    // 오류에 포함될 수 있는 토큰과 상류 본문은 로그·HTML에 기록하지 않는다.
    return { kind: 'unavailable' };
  }
});
