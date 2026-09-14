import type { CmsPostContent } from '@roottale/cms-client/server';

/**
 * 후기 테스트 픽스처. headnerve의 각 테스트가 같은 객체를 따로 만들던 것을
 * 한 곳으로 모았다 — CMS 응답 형태가 바뀌면 고칠 자리가 하나여야 한다.
 *
 * 테스트 전용이지만 `*.test.ts`가 아니라 일반 모듈이다. vitest `include`가
 * 테스트 파일만 실행하므로 여기 있는 헬퍼는 실행 대상이 아니다.
 */
export function reviewFixture(overrides: Partial<CmsPostContent> = {}): CmsPostContent {
  return {
    id: '01900000-0000-7000-8000-000000000001',
    tenantId: 'tenant',
    siteId: 'site',
    type: 'post',
    collectionKey: 'reviews',
    slug: 'knee-review',
    title: '무릎 치료 후기',
    excerpt: '무릎 통증 치료 경험담입니다.',
    featuredMediaId: null,
    featuredImageUrl: null,
    authorId: null,
    authorName: '이경무 원장',
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
    publishedAt: '2026-09-15T00:00:00.000Z',
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  };
}
