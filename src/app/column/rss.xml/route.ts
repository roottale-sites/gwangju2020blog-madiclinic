import { COLUMN_DATA_CACHE_TTL_SECONDS } from '../../../features/column/column-cache';
import { buildColumnRssXml } from '../../../features/column/column-rss';
import { resolveColumnArchive } from '../../../features/column/column-source';

/** 목록·사이트맵과 같은 주기이며, 발행 웹훅이 오면 그 전에 갱신된다. */
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
      'cache-control': `public, max-age=0, s-maxage=${COLUMN_DATA_CACHE_TTL_SECONDS}`,
    },
  });
}
