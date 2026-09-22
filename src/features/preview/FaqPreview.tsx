import type { CmsPostPreviewContent } from '@roottale/cms-client/server';
import { contentSource } from '../cms/content-source';
import FaqDetailPage from '../faq/FaqDetailPage';
import { faqEntryFromPost } from '../faq/faq-api';
import { faqSectionBySlug, faqTaxonomyFromCategories, faqTopicBySlug } from '../faq/faq-registry';
import { resolveFaqCollection } from '../faq/faq-source';
import { fetchFaqCategories } from '../faq/faq-wire';
import { PreviewMessage, PreviewNotice } from './PreviewNotice';

export default async function FaqPreview({ post }: Readonly<{ post: CmsPostPreviewContent }>) {
  try {
    const [categories, published] = await Promise.all([
      fetchFaqCategories({ apiKey: process.env.ROOTTALE_API_KEY?.trim() ?? '',
        baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com' }),
      resolveFaqCollection({ fresh: true }),
    ]);
    const entry = faqEntryFromPost({
      id: post.id, modelKey: post.modelKey ?? 'faq', collectionKey: post.collectionKey ?? 'faq',
      slug: post.slug, path: post.path ?? null, previousSlugs: post.previousSlugs ?? [],
      title: post.title, excerpt: post.excerpt, updatedAt: post.updatedAt,
      bodyJson: post.bodyJson, bodyHtml: post.bodyHtml ?? null, fields: post.fields ?? {},
      copiedFrom: contentSource(post.metaJson), terms: post.terms,
      relatedPostIds: post.relatedPosts?.map((related) => related.id) ?? [],
    }, categories, published.archive.entries);
    const taxonomy = faqTaxonomyFromCategories(categories);
    const section = entry && faqSectionBySlug(taxonomy, entry.sectionSlug);
    const topic = entry && faqTopicBySlug(taxonomy, entry.sectionSlug, entry.topicSlug);
    if (!entry || !section || !topic) return <PreviewMessage title="답변 내용을 확인해 주세요">
      두 단계 분류의 마지막 질환을 하나 선택하고 질문·요약 답변을 입력하면 미리보기를 볼 수 있습니다.
    </PreviewMessage>;
    const collection = { ...published, taxonomy, archive: { ...published.archive,
      entries: [...published.archive.entries.filter((item) => item.contentId !== post.id), entry],
    } };
    return <FaqDetailPage collection={collection} entry={entry} section={section} topic={topic}
      notice={<PreviewNotice expiresAt={post.preview.expiresAt} />} />;
  } catch {
    return <PreviewMessage title="분류를 불러오지 못했습니다">잠시 뒤 관리자에서 미리보기를 다시 열어 주세요.</PreviewMessage>;
  }
}
