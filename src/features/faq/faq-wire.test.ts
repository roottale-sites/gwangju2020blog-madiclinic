import { afterEach, describe, expect, test, vi } from 'vitest';

import { faqFixtureCategories } from './faq-fixture';
import {
  faqCategoryChain,
  fetchFaqCategories,
  fetchFaqModel,
  fetchFaqPostsPage,
} from './faq-wire';

const config = { apiKey: 'test-key', baseUrl: 'https://api.example.test' };

afterEach(() => vi.unstubAllGlobals());

describe('FAQ 공개 API 와이어', () => {
  test('콘텐츠 모델 응답에서 faq category_tree 계약을 찾는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      models: [
        { key: 'column', presentation: { kind: 'detail', detailPath: '/column/:slug' } },
        { key: 'faq', presentation: { kind: 'category_tree', basePath: '/faq', categoryDepth: 2 } },
      ],
    }), { status: 200 })));

    await expect(fetchFaqModel(config)).resolves.toEqual({
      key: 'faq', basePath: '/faq', categoryDepth: 2,
    });
  });

  test('category_tree가 아닌 faq 선언은 이 화면이 표현할 수 없어 없는 것으로 본다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      models: [{ key: 'faq', presentation: { kind: 'detail', detailPath: '/faq/:slug' } }],
    }), { status: 200 })));

    await expect(fetchFaqModel(config)).resolves.toBeNull();
  });

  /**
   * 진료 영역·세부 질환의 이름과 SEO 문구는 전부 이 응답에서 온다(PLAN.md §4.2).
   * headnerve는 그 문구를 코드의 정적 표에 갖고 있었다.
   */
  test('faq 소속 분류의 부모 관계와 설명·SEO 문구를 읽는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      categories: [
        {
          id: 's1', slug: 'spine', name: '척추 통증', parent_id: null, collection_key: 'faq',
          description: '목·허리 통증 질문', seo_title: '척추 통증 자주 묻는 질문', seo_description: '검사와 치료',
        },
        { id: 't1', slug: 'neck-pain', name: '목 통증', parent_id: 's1', collection_key: 'faq' },
        { id: 'c1', slug: 'news', name: '소식', parent_id: null, collection_key: 'column' },
      ],
    }), { status: 200 })));

    await expect(fetchFaqCategories(config)).resolves.toEqual([
      {
        id: 's1', slug: 'spine', name: '척추 통증', parentId: null, collectionKey: 'faq',
        description: '목·허리 통증 질문', seoTitle: '척추 통증 자주 묻는 질문', seoDescription: '검사와 치료',
      },
      {
        id: 't1', slug: 'neck-pain', name: '목 통증', parentId: 's1', collectionKey: 'faq',
        description: null, seoTitle: null, seoDescription: null,
      },
    ]);
  });

  test('글을 model_key=faq로 조회하고 term id와 본문 필드를 잃지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{
        id: 'post-1', model_key: 'faq', collection_key: 'faq', slug: 'mri-normal',
        title: '질문', excerpt: '답변',
        published_at: '2026-09-14T00:00:00.000Z', updated_at: '2026-09-15T00:00:00.000Z',
        body_json: { type: 'doc' }, body_html: '<p>상세</p>',
        terms: [{ id: 't1', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' }],
        pattern_slots: { post_footer: 'clinic-guide' },
        related_posts: [{ id: 'rel-1', title: '관련', slug: 'rel-1' }, { id: 'rel-2', title: '관련2', slug: 'rel-2' }],
      }],
      has_more: false,
      next_cursor: null,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await fetchFaqPostsPage(config);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('model_key=faq');
    expect(page.items[0]).toMatchObject({
      modelKey: 'faq', collectionKey: 'faq', slug: 'mri-normal', bodyHtml: '<p>상세</p>',
      terms: [{ id: 't1', taxonomy: 'category', slug: 'neck-pain', name: '목 통증' }],
      relatedPostIds: ['rel-1', 'rel-2'],
    });
    expect(page.items[0]).not.toHaveProperty('patternSlots');
  });

  test('비정상 응답은 장애로 올린다 — 빈 목록으로 낮추지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ message: '권한 없음' }), { status: 403 },
    )));
    await expect(fetchFaqPostsPage(config)).rejects.toThrow('권한 없음');
  });

  test('선택한 말단에서 2단계 분류 사슬을 계산하고 부모 선택은 거부한다', () => {
    expect(faqCategoryChain('top-neck', faqFixtureCategories, 2)?.map((category) => category.slug))
      .toEqual(['spine', 'neck-pain']);
    expect(faqCategoryChain('sec-spine', faqFixtureCategories, 2)).toBeNull();
    expect(faqCategoryChain('없는-분류', faqFixtureCategories, 2)).toBeNull();
  });
});
