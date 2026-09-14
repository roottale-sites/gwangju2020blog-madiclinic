import { loadReviewArchive } from '../../features/reviews/review-api';
import { REVIEW_DATA_CACHE_TTL_SECONDS } from '../../features/reviews/review-cache';
import { buildReviewSitemapXml } from '../../features/reviews/review-sitemap';

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const result = await loadReviewArchive();
  if (!result.ok) {
    return new Response('Review sitemap is temporarily unavailable.', {
      status: 503,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': '300',
      },
    });
  }

  return new Response(buildReviewSitemapXml(result.data), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${REVIEW_DATA_CACHE_TTL_SECONDS}`,
    },
  });
}
