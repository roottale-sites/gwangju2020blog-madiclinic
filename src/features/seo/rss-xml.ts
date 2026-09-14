type RssFeedItem = {
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string | null;
  category?: string | null;
  enclosure?: {
    url: string;
    type: string;
  } | null;
};

export type RssFeed = {
  title: string;
  link: string;
  description: string;
  selfUrl: string;
  language: string;
  items: readonly RssFeedItem[];
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function rssDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toUTCString();
}

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

function lastUpdatedAt(items: readonly RssFeedItem[]): string | null {
  let latest: Date | null = null;

  for (const item of items) {
    const candidate = new Date(item.updatedAt ?? item.publishedAt);
    if (!Number.isNaN(candidate.valueOf()) && (!latest || candidate > latest)) {
      latest = candidate;
    }
  }

  return latest?.toUTCString() ?? null;
}

function rssItemXml(item: RssFeedItem): string {
  const publishedAt = rssDate(item.publishedAt);
  const pubDate = publishedAt ? `<pubDate>${publishedAt}</pubDate>` : '';
  const author = item.author ? `<dc:creator>${cdata(item.author)}</dc:creator>` : '';
  const category = item.category ? `<category>${cdata(item.category)}</category>` : '';
  const enclosure = item.enclosure
    ? `<enclosure url="${escapeXml(item.enclosure.url)}" length="0" type="${escapeXml(item.enclosure.type)}"/>`
    : '';

  return [
    '    <item>',
    `      <title>${cdata(item.title)}</title>`,
    `      <link>${escapeXml(item.link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
    `      <description>${cdata(item.description)}</description>`,
    ...(pubDate ? [`      ${pubDate}`] : []),
    ...(author ? [`      ${author}`] : []),
    ...(category ? [`      ${category}`] : []),
    ...(enclosure ? [`      ${enclosure}`] : []),
    '    </item>',
  ].join('\n');
}

/** RSS 2.0 XML을 만든다. 콘텐츠별 URL·문구·정렬 정책은 호출 도메인이 맡는다. */
export function buildRssFeedXml(feed: RssFeed): string {
  const buildDate = lastUpdatedAt(feed.items);
  const lastBuildDate = buildDate ? `\n    <lastBuildDate>${buildDate}</lastBuildDate>` : '';
  const items = feed.items.map(rssItemXml).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(feed.title)}</title>`,
    `    <link>${escapeXml(feed.link)}</link>`,
    `    <description>${escapeXml(feed.description)}</description>`,
    `    <language>${escapeXml(feed.language)}</language>${lastBuildDate}`,
    `    <atom:link href="${escapeXml(feed.selfUrl)}" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].filter(Boolean).join('\n');
}
