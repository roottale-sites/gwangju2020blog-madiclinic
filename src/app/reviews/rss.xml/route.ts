import { loadReviewArchive } from '../../../features/reviews/review-api';
import { buildReviewRssXml } from '../../../features/reviews/review-rss';

export const revalidate = 86400;
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const result = await loadReviewArchive();
  if (!result.ok) {
    return new Response('Review RSS feed is temporarily unavailable.', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '300',
      },
    });
  }

  return new Response(buildReviewRssXml(result.data), {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      // 데이터 캐시는 유지하되 웹훅으로 지울 수 없는 CDN 응답 캐시는 금지한다.
      'cache-control': 'no-store',
    },
  });
}
