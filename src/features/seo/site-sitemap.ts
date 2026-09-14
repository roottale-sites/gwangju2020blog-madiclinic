import { siteUrl } from '../../data/site';
import { buildSitemapIndexXml } from './sitemap-xml';
import { STATIC_SITEMAP_LASTMOD } from './static-sitemap';

export const SITEMAP_CHILD_PATHS = [
  '/sitemap-static.xml',
  '/reviews-sitemap.xml',
  '/column-sitemap.xml',
  '/faq-sitemap.xml',
] as const;

const [staticSitemapPath, reviewSitemapPath, columnSitemapPath, faqSitemapPath] = SITEMAP_CHILD_PATHS;

export type SiteSitemapLastModified = {
  column: string;
  faq: string;
  reviews: string;
};

/**
 * 각 자식 사이트맵의 실제 변경 시각을 인덱스에도 노출한다.
 *
 * 정적 페이지는 전용 원장, 칼럼·후기는 CMS의 최신 수정일을 각각 사용한다.
 * 따라서 24시간 ISR 재생성만으로 lastmod가 바뀌지 않는다.
 */
export function buildSiteSitemapIndexXml(lastModified: SiteSitemapLastModified): string {
  return buildSitemapIndexXml([
    { loc: siteUrl(staticSitemapPath), lastmod: STATIC_SITEMAP_LASTMOD },
    { loc: siteUrl(reviewSitemapPath), lastmod: lastModified.reviews },
    { loc: siteUrl(columnSitemapPath), lastmod: lastModified.column },
    { loc: siteUrl(faqSitemapPath), lastmod: lastModified.faq },
  ]);
}
