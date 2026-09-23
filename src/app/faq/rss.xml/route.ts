import { FAQ_DATA_CACHE_TTL_SECONDS } from '../../../features/faq/faq-cache';
import { buildFaqRssXml } from '../../../features/faq/faq-rss';
import { resolveFaqCollection } from '../../../features/faq/faq-source';

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const collection = await resolveFaqCollection();
  if (collection.status !== 'ok') {
    return new Response('FAQ RSS를 일시적으로 만들 수 없습니다.', {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '300' },
    });
  }

  return new Response(buildFaqRssXml(collection.archive.entries), {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${FAQ_DATA_CACHE_TTL_SECONDS}`,
    },
  });
}
