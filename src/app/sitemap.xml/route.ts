import { columnSitemapLastModified, COLUMN_ARCHIVE_LASTMOD } from '../../features/column/column-sitemap';
import { resolveColumnArchive } from '../../features/column/column-source';
import { faqSitemapLastModified, FAQ_ARCHIVE_LASTMOD } from '../../features/faq/faq-sitemap';
import { resolveFaqCollection } from '../../features/faq/faq-source';
import { loadReviewArchive } from '../../features/reviews/review-api';
import { REVIEW_ARCHIVE_LASTMOD, reviewSitemapLastModified } from '../../features/reviews/review-sitemap';
import { buildSiteSitemapIndexXml } from '../../features/seo/site-sitemap';

export const revalidate = 86400;
export const dynamic = 'force-dynamic';

/**
 * 사이트맵 인덱스. `/robots.txt`가 가리키는 유일한 입구다.
 *
 * 자식 4개(정적 목록·후기·칼럼·FAQ)는 CMS 상태와 무관하게 언제나 나열한다 —
 * 지금 읽을 수 없는 컬렉션을 인덱스에서 빼면 크롤러가 그 주소들을 사라진 것으로
 * 읽는다. 각 자식이 자기 응답(빈 목록 또는 503)을 책임진다.
 *
 * `lastmod`는 각 컬렉션의 실제 최신 수정일이다. 읽을 수 없는 동안은 원장 기준일을
 * 쓴다 — 24시간 ISR 재생성이 수정일을 바꾸지 않아야 한다.
 */
export async function GET(): Promise<Response> {
  const [columnArchive, reviewArchive, faqCollection] = await Promise.all([
    resolveColumnArchive(),
    loadReviewArchive(),
    resolveFaqCollection(),
  ]);

  return new Response(buildSiteSitemapIndexXml({
    column: columnArchive.status === 'ok'
      ? columnSitemapLastModified(columnArchive.entries)
      : COLUMN_ARCHIVE_LASTMOD,
    faq: faqCollection.status === 'ok'
      ? faqSitemapLastModified(faqCollection.archive.entries)
      : FAQ_ARCHIVE_LASTMOD,
    reviews: reviewArchive.ok
      ? reviewSitemapLastModified(reviewArchive.data)
      : REVIEW_ARCHIVE_LASTMOD,
  }), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=86400',
    },
  });
}
