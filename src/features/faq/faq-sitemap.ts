import { siteUrl } from '../../data/site';
import { buildSitemapUrlSetXml, latestSitemapLastModified } from '../seo/sitemap-xml';
import {
  faqEntryPath,
  faqSectionPath,
  faqTopicPath,
  type FaqEntry,
} from './faq-model';

/**
 * FAQ 전용 사이트맵. headnerve `features/faq/faq-sitemap.ts` 그대로다.
 *
 * 홈과 **글이 있는** 진료 영역·세부 질환, 그리고 답변만 담는다(ADR-0006 §5). 글이
 * 없는 분류 화면은 크롤러에게 줄 내용이 없다.
 */
export const FAQ_ARCHIVE_LASTMOD = '2026-09-15T00:00:00.000Z';

export function faqSitemapLastModified(entries: readonly FaqEntry[]): string {
  return latestSitemapLastModified(entries.map((entry) => entry.updatedAt), FAQ_ARCHIVE_LASTMOD);
}

export function buildFaqSitemapXml(entries: readonly FaqEntry[]): string {
  const archiveLastModified = faqSitemapLastModified(entries);
  const sectionDates = new Map<string, string[]>();
  const topicDates = new Map<string, string[]>();

  for (const entry of entries) {
    const sectionPath = faqSectionPath(entry.sectionSlug);
    const topicPath = faqTopicPath(entry.sectionSlug, entry.topicSlug);
    sectionDates.set(sectionPath, [...(sectionDates.get(sectionPath) ?? []), entry.updatedAt]);
    topicDates.set(topicPath, [...(topicDates.get(topicPath) ?? []), entry.updatedAt]);
  }

  const latest = (dates: readonly string[]) => latestSitemapLastModified(dates.slice(1), dates[0] ?? archiveLastModified);
  return buildSitemapUrlSetXml([
    { loc: siteUrl('/faq'), lastmod: archiveLastModified },
    ...[...sectionDates].map(([path, dates]) => ({ loc: siteUrl(path), lastmod: latest(dates) })),
    ...[...topicDates].map(([path, dates]) => ({ loc: siteUrl(path), lastmod: latest(dates) })),
    ...entries.map((entry) => ({ loc: siteUrl(faqEntryPath(entry)), lastmod: entry.updatedAt })),
  ]);
}
