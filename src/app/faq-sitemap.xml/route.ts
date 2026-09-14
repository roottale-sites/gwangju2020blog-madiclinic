import { FAQ_DATA_CACHE_TTL_SECONDS } from '../../features/faq/faq-cache';
import { buildFaqSitemapXml } from '../../features/faq/faq-sitemap';
import { resolveFaqCollection } from '../../features/faq/faq-source';

export const revalidate = 86400;

/**
 * FAQ 사이트맵.
 *
 * CMS를 읽지 못하면 빈 사이트맵을 하루 캐시하지 않고 503 + `retry-after`로 답한다
 * (후기·칼럼 피드와 같은 판정). 빈 XML을 캐시하면 색인된 주소가 하루 동안
 * 사라진다.
 */
export async function GET(): Promise<Response> {
  const collection = await resolveFaqCollection();
  if (collection.status !== 'ok') {
    return new Response('FAQ 사이트맵을 일시적으로 만들 수 없습니다.', {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '300' },
    });
  }

  return new Response(buildFaqSitemapXml(collection.archive.entries), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${FAQ_DATA_CACHE_TTL_SECONDS}`,
    },
  });
}
