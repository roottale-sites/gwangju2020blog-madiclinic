import { buildFaqRssXml } from '../../../features/faq/faq-rss';
import { resolveFaqCollection } from '../../../features/faq/faq-source';

export const revalidate = 86400;
export const dynamic = 'force-dynamic';

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
      // 데이터 캐시는 유지하되 웹훅으로 지울 수 없는 CDN 응답 캐시는 금지한다.
      'cache-control': 'no-store',
    },
  });
}
