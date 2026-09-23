import { COLUMN_DATA_CACHE_TTL_SECONDS } from '../../features/column/column-cache';
import { buildColumnSitemapXml } from '../../features/column/column-sitemap';
import { resolveColumnArchive, resolveColumnCategories } from '../../features/column/column-source';

/**
 * 목록·상세와 같은 24시간 주기. 발행 웹훅이 오면 그 전에 갱신된다.
 *
 * 세그먼트 설정은 빌드 타임에 정적으로 읽힐 리터럴이어야 해서
 * `COLUMN_DATA_CACHE_TTL_SECONDS`를 그대로 쓸 수 없다. 값이 갈라지지 않도록
 * 아래 테스트가 둘을 대조한다(`column-sitemap.test.ts`).
 */
export const revalidate = 86400;
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const [archive, categories] = await Promise.all([
    resolveColumnArchive(),
    resolveColumnCategories(),
  ]);
  if (archive.status !== 'ok' || categories.status !== 'ok') {
    return new Response('Column sitemap is temporarily unavailable.', {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '300' },
    });
  }
  return new Response(buildColumnSitemapXml(archive.entries, categories.categories), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${COLUMN_DATA_CACHE_TTL_SECONDS}`,
    },
  });
}
