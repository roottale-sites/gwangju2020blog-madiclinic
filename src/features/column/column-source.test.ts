import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * 출처 경계 회귀 테스트.
 *
 * 핵심 계약은 "CMS 성공 응답이 곧 진실"이다. ROOT-ADMIN에서 글을 내리거나 지웠는데
 * 사이트에 남아 있으면 관리자가 사이트를 통제할 수 없다. headnerve는 실패 두
 * 가지에서 이관 JSON 88건으로 되돌아갔지만, 이 저장소에는 폴백 콘텐츠가 없어
 * (PLAN.md §5.3) 실패를 `status`로 알리고 화면이 안내 문구를 띄운다.
 */
const loadColumnArchive = vi.fn();
const loadColumnCategories = vi.fn();
const loadColumnPost = vi.fn();

vi.mock('./column-api', () => ({
  loadColumnArchive: () => loadColumnArchive(),
  loadColumnCategories: () => loadColumnCategories(),
  loadColumnPost: (slug: string) => loadColumnPost(slug),
}));

const { resolveColumnArchive, resolveColumnCategories, resolveColumnCategoryArchive, resolveColumnEntry } =
  await import('./column-source');

function cmsPost(overrides: Record<string, unknown> = {}) {
  return {
    id: '0193-post',
    type: 'post',
    collectionKey: 'column',
    slug: 'knee-pain',
    title: 'ROOT-ADMIN에서 방금 발행한 글',
    excerpt: '관리자가 새로 쓴 글입니다.',
    publishedAt: '2026-09-15T00:00:00+09:00',
    bodyJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '본문' }] }] },
    metaJson: {},
    terms: [{ taxonomy: 'category', slug: 'knee', name: '무릎' }],
    ...overrides,
  };
}

function cmsCategory(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'knee',
    name: '무릎',
    path: '/column/knee',
    description: '무릎 통증 글입니다.',
    seoTitle: '무릎 통증',
    seoDescription: '무릎 통증의 원인과 비수술 치료.',
    publishedPostCount: 1,
    ...overrides,
  };
}

beforeEach(() => {
  loadColumnArchive.mockReset();
  loadColumnCategories.mockReset();
  loadColumnPost.mockReset();
});

describe('칼럼 목록 출처', () => {
  test('CMS가 응답하면 그 글이 목록이 된다', async () => {
    loadColumnArchive.mockResolvedValue({ ok: true, data: [cmsPost()] });

    const archive = await resolveColumnArchive();

    expect(archive.status).toBe('ok');
    expect(archive.entries.map((entry) => entry.slug)).toEqual(['knee-pain']);
  });

  test('CMS가 빈 목록을 성공으로 주면 빈 목록 그대로 둔다', async () => {
    // 관리자가 전부 비공개로 돌린 상태. 여기서 옛 글을 되살리면 통제 불능이 된다.
    loadColumnArchive.mockResolvedValue({ ok: true, data: [] });

    await expect(resolveColumnArchive()).resolves.toEqual({ entries: [], status: 'ok' });
  });

  test.each(['unconfigured', 'upstream'] as const)(
    '%s 실패는 빈 목록 + 오류 상태다(폴백 콘텐츠 없음)',
    async (reason) => {
      loadColumnArchive.mockResolvedValue({ ok: false, reason });

      await expect(resolveColumnArchive()).resolves.toEqual({ entries: [], status: reason });
    },
  );

  test('분류가 붙지 않은 글은 주소를 만들 수 없어 목록에서 뺀다', async () => {
    loadColumnArchive.mockResolvedValue({
      ok: true,
      data: [cmsPost(), cmsPost({ slug: 'no-category', terms: [] })],
    });

    const archive = await resolveColumnArchive();

    expect(archive.entries.map((entry) => entry.slug)).toEqual(['knee-pain']);
  });

  test('발행일 내림차순으로 정렬한다', async () => {
    loadColumnArchive.mockResolvedValue({
      ok: true,
      data: [
        cmsPost({ slug: 'older', publishedAt: '2026-01-01T00:00:00+09:00' }),
        cmsPost({ slug: 'newer', publishedAt: '2026-09-01T00:00:00+09:00' }),
      ],
    });

    const archive = await resolveColumnArchive();

    expect(archive.entries.map((entry) => entry.slug)).toEqual(['newer', 'older']);
  });
});

describe('칼럼 분류 출처', () => {
  test('분류 목록·SEO 문구는 CMS 공개 분류 API에서 읽는다', async () => {
    loadColumnCategories.mockResolvedValue({ ok: true, data: [cmsCategory()] });

    const list = await resolveColumnCategories();

    expect(list.status).toBe('ok');
    expect(list.categories[0]).toEqual({
      slug: 'knee',
      name: '무릎',
      path: '/column/knee',
      description: '무릎 통증 글입니다.',
      seoTitle: '무릎 통증',
      seoDescription: '무릎 통증의 원인과 비수술 치료.',
      publishedPostCount: 1,
    });
  });

  test('CMS가 SEO 값을 비워 두면 분류 이름으로 채운다', async () => {
    loadColumnCategories.mockResolvedValue({
      ok: true,
      data: [cmsCategory({ path: null, description: null, seoTitle: null, seoDescription: null })],
    });

    const list = await resolveColumnCategories();

    expect(list.categories[0]).toMatchObject({
      path: '/column/knee',
      seoTitle: '무릎',
      seoDescription: '',
    });
  });

  test.each(['unconfigured', 'upstream'] as const)(
    '%s 실패는 빈 분류 목록 + 오류 상태다',
    async (reason) => {
      loadColumnCategories.mockResolvedValue({ ok: false, reason });

      await expect(resolveColumnCategories()).resolves.toEqual({ categories: [], status: reason });
    },
  );

  test('ROOT-ADMIN에서 만든 분류면 코드에 없던 slug도 허브로 연다', async () => {
    loadColumnCategories.mockResolvedValue({ ok: true, data: [cmsCategory({ slug: 'spine', name: '척추', path: '/column/spine' })] });
    loadColumnArchive.mockResolvedValue({
      ok: true,
      data: [cmsPost({ slug: '허리-통증', terms: [{ taxonomy: 'category', slug: 'spine', name: '척추' }] })],
    });

    const archive = await resolveColumnCategoryArchive('spine');

    expect(archive?.category.path).toBe('/column/spine');
    expect(archive?.entries.map((entry) => entry.slug)).toEqual(['허리-통증']);
  });

  test('없는 분류는 null이라 라우트가 상세 경로로 넘긴다', async () => {
    loadColumnCategories.mockResolvedValue({ ok: true, data: [cmsCategory()] });
    loadColumnArchive.mockResolvedValue({ ok: true, data: [] });

    expect(await resolveColumnCategoryArchive('없는-분류')).toBeNull();
  });

  test('글이 0건인 분류도 빈 목록 화면으로 연다', async () => {
    // headnerve는 0건 분류를 상세 경로로 넘겼다(2층 구주소 때문). 이 저장소에는
    // 구주소가 없어 분류가 있으면 분류 화면이 맞다.
    loadColumnCategories.mockResolvedValue({ ok: true, data: [cmsCategory({ publishedPostCount: 0 })] });
    loadColumnArchive.mockResolvedValue({ ok: true, data: [] });

    const archive = await resolveColumnCategoryArchive('knee');

    expect(archive?.entries).toEqual([]);
  });
});

describe('칼럼 상세 출처', () => {
  test('ROOT-ADMIN이 새로 발행한 슬러그가 동적으로 열린다', async () => {
    loadColumnPost.mockResolvedValue({ ok: true, data: cmsPost() });

    const entry = await resolveColumnEntry('knee-pain');

    expect(entry?.title).toBe('ROOT-ADMIN에서 방금 발행한 글');
    expect(entry?.bodyHtml).toContain('<p>본문</p>');
  });

  test('CMS가 성공적으로 null을 주면 없는 글이다', async () => {
    loadColumnPost.mockResolvedValue({ ok: true, data: null });

    expect(await resolveColumnEntry('gone')).toBeNull();
  });

  test.each(['unconfigured', 'upstream'] as const)('%s 실패는 404다', async (reason) => {
    loadColumnPost.mockResolvedValue({ ok: false, reason });

    expect(await resolveColumnEntry('knee-pain')).toBeNull();
  });

  test('분류가 붙지 않은 글은 공개 주소가 없어 404다', async () => {
    loadColumnPost.mockResolvedValue({ ok: true, data: cmsPost({ terms: [] }) });

    expect(await resolveColumnEntry('no-category')).toBeNull();
  });
});
