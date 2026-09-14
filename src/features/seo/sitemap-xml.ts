export type SitemapUrlEntry = {
  loc: string;
  lastmod?: string | null;
};

/** 브라우저에서는 XML을 표로, 크롤러에는 표준 Sitemap XML로 제공한다. */
const SITEMAP_STYLESHEET = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function buildSitemapUrlSetXml(entries: readonly SitemapUrlEntry[]): string {
  const urls = entries.map(({ loc, lastmod }) => {
    const lastModified = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <url><loc>${escapeXml(loc)}</loc>${lastModified}</url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    SITEMAP_STYLESHEET,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * 날짜 문자열 중 실제로 가장 최근인 값을 반환한다.
 *
 * CMS가 서로 다른 UTC 오프셋으로 수정일을 보내므로 문자열 정렬이 아니라
 * 시간값으로 비교한다. 읽을 수 없는 값은 신뢰할 수 없으므로 기준 날짜보다
 * 최근으로 취급하지 않는다.
 */
export function latestSitemapLastModified(
  lastModifiedValues: readonly string[],
  fallback: string,
): string {
  const fallbackTime = Date.parse(fallback);
  let latest = fallback;
  let latestTime = Number.isNaN(fallbackTime) ? Number.NEGATIVE_INFINITY : fallbackTime;

  for (const value of lastModifiedValues) {
    const valueTime = Date.parse(value);
    if (!Number.isNaN(valueTime) && valueTime > latestTime) {
      latest = value;
      latestTime = valueTime;
    }
  }

  return latest;
}

export function buildSitemapIndexXml(entries: readonly SitemapUrlEntry[]): string {
  const sitemaps = entries.map(({ loc, lastmod }) => {
    const lastModified = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <sitemap><loc>${escapeXml(loc)}</loc>${lastModified}</sitemap>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    SITEMAP_STYLESHEET,
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps,
    '</sitemapindex>',
    '',
  ].join('\n');
}
