import type { CmsPostContent } from '@roottale/cms-client/server';
import { describe, expect, test } from 'vitest';

import { reviewFaqItems } from './review-faq';

function review(overrides: Partial<CmsPostContent> = {}): CmsPostContent {
  return {
    id: '01900000-0000-7000-8000-000000000001',
    tenantId: 'tenant',
    siteId: 'site',
    type: 'post',
    collectionKey: 'reviews',
    slug: 'sample-review',
    title: '치료 후기',
    excerpt: null,
    featuredMediaId: null,
    featuredImageUrl: null,
    authorId: null,
    authorName: null,
    authorImageUrl: null,
    authorBio: null,
    authorSlug: null,
    bodyJson: { type: 'doc', content: [] },
    status: 'published',
    metaJson: {},
    fields: null,
    fieldsMeta: [],
    terms: [],
    archiveRelated: [],
    publishedAt: '2026-08-07T00:00:00.000Z',
    createdAt: '2026-08-07T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
    ...overrides,
  };
}

describe('후기 FAQ', () => {
  test('CMS 본문 FAQ를 읽는다', () => {
    const items = reviewFaqItems(review({
      bodyJson: {
        type: 'doc',
        content: [{
          type: 'faq',
          content: [{
            type: 'faqItem',
            content: [
              { type: 'faqQuestion', content: [{ type: 'text', text: '질문' }] },
              { type: 'faqAnswer', content: [{ type: 'paragraph', content: [{ type: 'text', text: '답변' }] }] },
            ],
          }],
        }],
      },
    }));

    expect(items).toEqual([{ question: '질문', answer: '답변' }]);
  });

  test('CMS 본문에 FAQ가 없으면 빈 목록을 반환한다', () => {
    const items = reviewFaqItems(review({ slug: '신경외과-안과-약-안-듣던-두통-공부-집중하다' }));

    expect(items).toEqual([]);
  });
});
