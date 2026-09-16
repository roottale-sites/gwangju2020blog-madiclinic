import { beforeEach, describe, expect, test, vi } from 'vitest';

const loadFaqCatalog = vi.fn();
const isFaqCmsConfigured = vi.fn(() => true);

vi.mock('./faq-api', () => ({
  loadFaqCatalog: (...args: unknown[]) => loadFaqCatalog(...args),
  isFaqCmsConfigured: () => isFaqCmsConfigured(),
}));
vi.mock('next/cache', () => ({
  unstable_cache: (callback: () => Promise<unknown>) => callback,
}));

const { resolveFaqArchive, resolveFaqCollection, resolveFaqDetailCollection } =
  await import('./faq-source');
const { faqFixtureCategories, faqFixtureEntries } = await import('./faq-fixture');
const { faqTaxonomyFromCategories } = await import('./faq-registry');

const catalog = {
  archive: { source: 'cms' as const, entries: faqFixtureEntries },
  taxonomy: faqTaxonomyFromCategories(faqFixtureCategories),
};

beforeEach(() => {
  loadFaqCatalog.mockReset();
  isFaqCmsConfigured.mockReset();
  isFaqCmsConfigured.mockReturnValue(true);
});

describe('FAQ 출처 경계', () => {
  test('CMS 성공 응답은 빈 목록도 권위 있게 유지한다', async () => {
    loadFaqCatalog.mockResolvedValue({
      ok: true,
      data: { archive: { source: 'cms', entries: [] }, taxonomy: catalog.taxonomy },
    });

    const collection = await resolveFaqCollection();
    expect(collection.status).toBe('ok');
    expect(collection.archive.entries).toEqual([]);
    expect(collection.taxonomy.sections).toHaveLength(2);
  });

  /**
   * headnerve는 이 세 상태에서 검수 FAQ 71건을 대신 보여 줬다. 이 저장소는 폴백
   * 콘텐츠가 없으므로(PLAN.md §5.3) 사유를 그대로 내보내고 화면이 안내한다.
   */
  test.each(['unconfigured', 'no-model', 'upstream'] as const)(
    '%s는 빈 원장 + 같은 이름의 상태로 내려간다',
    async (reason) => {
      loadFaqCatalog.mockResolvedValue({ ok: false, reason });

      const collection = await resolveFaqCollection();
      expect(collection.status).toBe(reason);
      expect(collection.archive).toEqual({ source: 'fallback', entries: [] });
      expect(collection.taxonomy).toEqual({ sections: [], topics: [] });
    },
  );

  test('웹훅용 원장 조회는 fresh 옵션을 그대로 넘긴다', async () => {
    loadFaqCatalog.mockResolvedValue({ ok: true, data: catalog });

    await expect(resolveFaqArchive({ fresh: true })).resolves.toEqual(catalog.archive);
    expect(loadFaqCatalog).toHaveBeenCalledWith({ fresh: true });
  });
});

describe('FAQ 상세 선택', () => {
  test('요청한 글과 관련 질문만 남긴 원장을 돌려준다', async () => {
    loadFaqCatalog.mockResolvedValue({ ok: true, data: catalog });

    const detail = await resolveFaqDetailCollection('spine', 'neck-pain', 'mri-normal');
    expect(detail.entry?.slug).toBe('mri-normal');
    expect(detail.archive.entries.map((entry) => entry.slug)).toEqual(['mri-normal', 'desk-posture']);
    expect(detail.status).toBe('ok');
  });

  test('없는 글은 entry가 null이고 상태는 성공이다 — 라우트가 404로 끊는다', async () => {
    loadFaqCatalog.mockResolvedValue({ ok: true, data: catalog });

    const detail = await resolveFaqDetailCollection('spine', 'neck-pain', '없는-질문');
    expect(detail.entry).toBeNull();
    expect(detail.status).toBe('ok');
    expect(detail.archive.entries).toEqual([]);
  });

  test('CMS를 읽을 수 없으면 상태가 사유를 담는다 — 없는 글로 단정하지 않는다', async () => {
    loadFaqCatalog.mockResolvedValue({ ok: false, reason: 'upstream' });

    const detail = await resolveFaqDetailCollection('spine', 'neck-pain', 'mri-normal');
    expect(detail.entry).toBeNull();
    expect(detail.status).toBe('upstream');
  });

  test('네 단계 형태가 아닌 요청은 CMS를 부르지 않는다', async () => {
    const detail = await resolveFaqDetailCollection('spine', '', 'mri-normal');
    expect(detail.entry).toBeNull();
    expect(loadFaqCatalog).not.toHaveBeenCalled();
  });

  /**
   * 상세 캐시는 `unstable_cache` 엔트리라 키가 있던 실행의 결과가 디스크에 남는다.
   * 비밀값 게이트가 캐시보다 먼저여야 그 결과가 키 없는 실행에서 되살아나지 않는다
   * (로컬 목 CMS로 한 번 돌린 뒤 키 없이 띄웠을 때 실제로 되살아났다).
   */
  test('비밀값이 없으면 상세 캐시를 들여다보지 않는다', async () => {
    isFaqCmsConfigured.mockReturnValue(false);

    const detail = await resolveFaqDetailCollection('spine', 'neck-pain', 'mri-normal');
    expect(detail.status).toBe('unconfigured');
    expect(detail.entry).toBeNull();
    expect(loadFaqCatalog).not.toHaveBeenCalled();
  });
});
