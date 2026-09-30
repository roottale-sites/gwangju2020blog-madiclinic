import { buildColumnRssXml } from '../../../features/column/column-rss';
import { resolveColumnArchive } from '../../../features/column/column-source';

/** CMS 데이터 캐시는 웹훅으로 갱신하고, XML 응답은 별도 CDN 캐시에 남기지 않는다. */
export const revalidate = 86400;
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const archive = await resolveColumnArchive();
  if (archive.status !== 'ok') {
    return new Response('Column RSS feed is temporarily unavailable.', {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '300' },
    });
  }
  return new Response(buildColumnRssXml(archive.entries), {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
