import { clinic } from '../../data/clinic';
import { siteUrl } from '../../data/site';
import { buildRssFeedXml } from '../seo/rss-xml';
import { faqIndexMetadata } from './faq-content';
import { cleanFaqAnswer, cleanFaqQuestion, faqEntryPath, type FaqEntry } from './faq-model';

export const FAQ_RSS_PATH = '/faq/rss.xml';

/** 발행된 질문의 수정 시각을 피드 발행 시각으로 사용한다. */
export function buildFaqRssXml(entries: readonly FaqEntry[]): string {
  const newestFirst = [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return buildRssFeedXml({
    title: faqIndexMetadata.title,
    link: siteUrl('/faq'),
    description: faqIndexMetadata.description,
    selfUrl: siteUrl(FAQ_RSS_PATH),
    language: 'ko-KR',
    items: newestFirst.map((entry) => ({
      title: cleanFaqQuestion(entry.question),
      link: siteUrl(faqEntryPath(entry)),
      description: cleanFaqAnswer(entry.answer),
      publishedAt: entry.updatedAt,
      updatedAt: entry.updatedAt,
      author: clinic.representative,
      category: entry.topicName,
    })),
  });
}
