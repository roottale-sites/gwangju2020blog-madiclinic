import type { Metadata } from 'next';
import { pageSeoMetadata } from '../seo/cms-metadata';
import { loadDefaultOgImage } from '../seo/cms-seo-settings';
import { faqDescription, faqTitleWithSuffix } from './faq-content';
import { faqEntryPath, type FaqEntry, type FaqSection, type FaqTopic } from './faq-model';

/** 영역 직속·질환 하위 FAQ가 같은 검색·공유 규칙을 사용한다. */
export async function faqEntryMetadata(entry: FaqEntry): Promise<Metadata> {
  const seo = entry.seo;
  return {
    ...pageSeoMetadata(faqEntryPath(entry), {
      ...seo,
      title: seo?.title ?? faqTitleWithSuffix(entry.question),
      description: faqDescription(seo?.description ?? entry.answer),
      imageUrl: seo?.ogImage ?? entry.shareImageUrl ?? await loadDefaultOgImage(),
      imageAlt: seo?.ogImage ? seo.ogImageAlt : undefined,
    }),
    other: {
      ...(entry.contentId ? { 'rt:content-id': entry.contentId } : {}),
      'roottale:revision': entry.updatedAt,
    },
  };
}

export async function faqCategoryMetadata(
  path: string,
  category: FaqSection | FaqTopic,
  filtered: boolean,
): Promise<Metadata> {
  return pageSeoMetadata(path, {
    title: category.seoTitle ?? faqTitleWithSuffix(category.pageTitle),
    description: category.seoDescription,
    imageUrl: await loadDefaultOgImage(),
    noindex: filtered,
  });
}
