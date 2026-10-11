import { metadataRoutes } from '../../features/seo/metadata-contract';
import { loadSitemapMetadata } from '../../features/seo/sitemap-metadata';
import { buildStaticSitemapXml } from '../../features/seo/static-sitemap';

/**
 * 정적 페이지 사이트맵 — 세 기능의 목록 페이지(`/column`·`/reviews`·`/faq`)뿐이다.
 * CMS 글은 각자의 전용 사이트맵이 소유한다.
 *
 * 원장이 바뀐 배포에서 새 XML을 만들고 평소에는 하루 동안 재사용한다.
 */
export const revalidate = 86400;
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return new Response(buildStaticSitemapXml(await loadSitemapMetadata(metadataRoutes.map((route) => route.routeKey))), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
