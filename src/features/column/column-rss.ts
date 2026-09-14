import { clinic } from '../../data/clinic';
import { siteUrl } from '../../data/site';
import { buildRssFeedXml } from '../seo/rss-xml';
import { columnIndexMetadata } from './column-content';
import { columnEntryPath, type ColumnArchiveEntry } from './column-model';

export const COLUMN_RSS_PATH = '/column/rss.xml';
/** 글에 대표 이미지가 없을 때 쓰는 기본 도판. 본 사이트 헤더 로고다. */
const COLUMN_RSS_FALLBACK_IMAGE_PATH = '/madi/img/hi_gwangju2020_20240826.png';

function newestFirst(entries: readonly ColumnArchiveEntry[]): ColumnArchiveEntry[] {
  return [...entries].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function imageMimeType(url: string): string {
  const pathname = new URL(url, siteUrl('/')).pathname.toLowerCase();
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function columnImageUrl(entry: ColumnArchiveEntry): string {
  if (!entry.featuredImageUrl) return siteUrl(COLUMN_RSS_FALLBACK_IMAGE_PATH);
  if (entry.featuredImageUrl.startsWith('/') && !entry.featuredImageUrl.startsWith('//')) {
    return siteUrl(entry.featuredImageUrl);
  }

  try {
    const url = new URL(entry.featuredImageUrl);
    return url.protocol === 'https:' ? url.toString() : siteUrl(COLUMN_RSS_FALLBACK_IMAGE_PATH);
  } catch {
    return siteUrl(COLUMN_RSS_FALLBACK_IMAGE_PATH);
  }
}

function columnRssItem(entry: ColumnArchiveEntry) {
  const imageUrl = columnImageUrl(entry);

  return {
    title: entry.title,
    link: siteUrl(columnEntryPath(entry)),
    description: entry.description,
    publishedAt: entry.publishedAt,
    updatedAt: entry.updatedAt,
    author: clinic.representative,
    // headnerve는 질환 링크 규칙에서 분류 이름을 만들었다. 이 저장소는 글에 붙은
    // CMS 분류를 그대로 쓴다(코드에 분류를 두지 않는다, PLAN.md §4.2).
    category: entry.category.name,
    enclosure: { url: imageUrl, type: imageMimeType(imageUrl) },
  };
}

/** 현재 공개된 칼럼 목록으로 RSS 2.0 피드를 만든다. */
export function buildColumnRssXml(entries: readonly ColumnArchiveEntry[]): string {
  return buildRssFeedXml({
    title: columnIndexMetadata.title,
    link: siteUrl('/column'),
    description: columnIndexMetadata.description,
    selfUrl: siteUrl(COLUMN_RSS_PATH),
    language: 'ko-KR',
    items: newestFirst(entries).map(columnRssItem),
  });
}
