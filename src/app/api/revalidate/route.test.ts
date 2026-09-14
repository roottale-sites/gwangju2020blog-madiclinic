import { beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * 웹훅 라우트 배선 계약.
 *
 * 순수 헬퍼(`features/cms/revalidation`)는 자체 테스트가 있지만, 그 판정을
 * 실제 무효화 호출로 옮기는 이 라우트는 덮여 있지 않았다. 후기 한 컬렉션에서
 * 두 컬렉션 루프로 바뀐 것이 바로 이 배선이라, 태그·경로·상세 라우트가 하나라도
 * 빠지면 ROOT-ADMIN에서 발행해도 사이트가 그대로 남는다.
 *
 * 모킹은 진짜 경계 둘뿐이다 — Next 캐시 API와 서명 검증. 대상 선정과 경로 구성은
 * 실제 모듈이 그대로 돈다.
 */
const revalidatePath = vi.fn();
const revalidateTag = vi.fn();
const verifyRootTaleWebhook = vi.fn();
const resolveFaqArchive = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  unstable_cache: (callback: (...args: unknown[]) => unknown) => callback,
}));

vi.mock('@roottale/cms-client/webhook', () => ({
  verifyRootTaleWebhook: (...args: unknown[]) => verifyRootTaleWebhook(...args),
}));

/**
 * FAQ 역참조 무효화는 CMS를 직접 읽는다(`{ fresh: true }`). 그 경계도 모킹해
 * 라우트의 배선만 본다 — 원장 계산은 `features/faq/faq-revalidation` 자체
 * 테스트가 덮는다.
 */
vi.mock('../../../features/faq/faq-source', () => ({
  resolveFaqArchive: (...args: unknown[]) => resolveFaqArchive(...args),
}));

const { GET, POST } = await import('./route');
const { faqFixtureEntries } = await import('../../../features/faq/faq-fixture');

function webhookRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://gwangju2020blog.madiclinic.co.kr/api/revalidate', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  revalidatePath.mockReset();
  revalidateTag.mockReset();
  verifyRootTaleWebhook.mockReset();
  resolveFaqArchive.mockReset();
  resolveFaqArchive.mockResolvedValue({ source: 'cms', entries: [] });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubEnv('ROOTTALE_API_KEY', 'test_key');
  verifyRootTaleWebhook.mockResolvedValue({ ok: true, event: 'post.published', deliveryId: 'd1' });
});

describe('칼럼 웹훅 무효화 배선', () => {
  test('칼럼 태그와 목록·사이트맵·RSS·상세 경로를 모두 무효화한다', async () => {
    const response = await POST(webhookRequest({
      paths: ['/column', '/column/headache', '/column/headache/새-글'],
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      revalidated: true,
      paths: [
        '/column',
        '/column-sitemap.xml',
        '/column/rss.xml',
        '/sitemap.xml',
        '/column/headache',
        '/column/headache/새-글',
      ],
    });

    expect(revalidateTag.mock.calls).toEqual([
      ['column:archive', { expire: 0 }],
      ['column:detail:새-글', { expire: 0 }],
    ]);
    // 사이트맵 라우트가 빠지면 새 글이 하루 동안 사이트맵에 안 잡힌다.
    expect(revalidatePath.mock.calls).toEqual([
      ['/column'],
      ['/column-sitemap.xml'],
      ['/column/rss.xml'],
      ['/sitemap.xml'],
      ['/column/headache'],
      ['/column/headache/새-글'],
    ]);
  });

  test('칼럼 웹훅은 후기 캐시를 건드리지 않는다', async () => {
    await POST(webhookRequest({ paths: ['/column/headache/새-글'] }));

    expect(revalidateTag).not.toHaveBeenCalledWith('reviews:all', { expire: 0 });
    expect(revalidatePath).not.toHaveBeenCalledWith('/reviews');
  });

  test('분류 변경은 세 컬렉션을 모두 무효화한다', async () => {
    verifyRootTaleWebhook.mockResolvedValue({ ok: true, event: 'taxonomy.updated', deliveryId: 'd2' });

    const response = await POST(webhookRequest({ paths: [] }));

    expect(response.status).toBe(200);
    // 사이트 전체 이벤트는 세 컬렉션을 갱신한다.
    expect(revalidateTag.mock.calls).toEqual([
      ['reviews:all', { expire: 0 }],
      ['column:all', { expire: 0 }],
      ['faq:all', { expire: 0 }],
    ]);
    expect(revalidatePath.mock.calls).toEqual([
      ['/reviews'],
      ['/reviews-sitemap.xml'],
      ['/reviews/rss.xml'],
      ['/sitemap.xml'],
      ['/reviews/[slug]', 'page'],
      ['/column'],
      ['/column-sitemap.xml'],
      ['/column/rss.xml'],
      ['/column/[category]', 'page'],
      ['/column/[category]/[slug]', 'page'],
      ['/faq'],
      ['/faq-sitemap.xml'],
      ['/faq/[section]', 'page'],
      ['/faq/[section]/[topic]', 'page'],
      ['/faq/[section]/[topic]/[slug]', 'page'],
    ]);
  });
});

describe('FAQ 웹훅 무효화 배선', () => {
  test('FAQ 태그와 목록·사이트맵·상세 경로를 무효화한다', async () => {
    const detailPath = '/faq/spine/neck-pain/mri-normal';

    const response = await POST(webhookRequest({ paths: [detailPath], postId: 'post-neck-mri' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      revalidated: true,
      paths: ['/faq', '/faq-sitemap.xml', '/sitemap.xml', detailPath],
    });
    expect(revalidateTag.mock.calls).toEqual([
      ['faq:archive', { expire: 0 }],
      ['faq:detail:faq.spine.neck-pain.mri-normal', { expire: 0 }],
    ]);
    expect(revalidatePath.mock.calls).toEqual([
      ['/faq'],
      ['/faq-sitemap.xml'],
      ['/sitemap.xml'],
      [detailPath],
    ]);
  });

  /**
   * 발행된 글을 "공개 FAQ 선택"·본문 예약 링크로 가리키는 상세도 함께 갱신해야
   * 한다. 그 화면은 자기 캐시 태그가 무효화되지 않으면 옛 관련 목록·옛 문구를
   * 하루 동안 그대로 보여 준다.
   */
  test('역참조한 FAQ 상세와 그 캐시 태그까지 함께 무효화한다', async () => {
    resolveFaqArchive.mockResolvedValue({
      source: 'cms',
      entries: [
        { ...faqFixtureEntries[1]!, relatedContentIds: ['post-neck-mri'] },
        { ...faqFixtureEntries[3]!, referencedContentKeys: ['faq.spine.neck-pain.mri-normal'] },
        faqFixtureEntries[2]!,
      ],
    });

    const response = await POST(webhookRequest({
      paths: ['/faq/spine/neck-pain/mri-normal'],
      postId: 'post-neck-mri',
    }));

    expect(resolveFaqArchive).toHaveBeenCalledWith({ fresh: true });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      revalidated: true,
      paths: [
        '/faq',
        '/faq-sitemap.xml',
        '/sitemap.xml',
        '/faq/spine/neck-pain/mri-normal',
        '/faq/spine/neck-pain/desk-posture',
        '/faq/joint/knee/how-long',
      ],
    });
    expect(revalidateTag.mock.calls).toEqual([
      ['faq:archive', { expire: 0 }],
      ['faq:detail:faq.spine.neck-pain.mri-normal', { expire: 0 }],
      ['faq:detail:faq.spine.neck-pain.desk-posture', { expire: 0 }],
      ['faq:detail:faq.joint.knee.how-long', { expire: 0 }],
    ]);
  });

  test('칼럼·후기 웹훅은 FAQ 원장을 읽지 않는다', async () => {
    await POST(webhookRequest({ paths: ['/column/spine/새-글'] }));
    await POST(webhookRequest({ paths: ['/reviews/sample'] }));

    expect(resolveFaqArchive).not.toHaveBeenCalled();
  });
});

describe('후기 웹훅 무효화 배선', () => {
  test('후기 태그와 목록·사이트맵·RSS·상세 경로를 모두 무효화한다', async () => {
    const response = await POST(webhookRequest({ paths: ['/reviews/sample'] }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      revalidated: true,
      paths: ['/reviews', '/reviews-sitemap.xml', '/reviews/rss.xml', '/sitemap.xml', '/reviews/sample'],
    });
    expect(revalidateTag.mock.calls).toEqual([
      ['reviews:archive', { expire: 0 }],
      ['reviews:detail:sample', { expire: 0 }],
    ]);
    expect(revalidatePath.mock.calls).toEqual([
      ['/reviews'],
      ['/reviews-sitemap.xml'],
      ['/reviews/rss.xml'],
      ['/sitemap.xml'],
      ['/reviews/sample'],
    ]);
  });
});

describe('라우트 오류 처리', () => {
  test('글 웹훅의 관계없는 경로는 422로 답해 ROOT-ADMIN이 실패를 기록하게 한다', async () => {
    const response = await POST(webhookRequest({ paths: ['/about'] }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'unsupported_revalidation_target',
    });
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('column 모델이 /blog 경로로 오면 모델-경로 불일치를 422로 드러낸다', async () => {
    const response = await POST(webhookRequest({
      modelKey: 'column',
      paths: ['/blog', '/blog/sample'],
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: 'model_path_mismatch',
    });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('model_path_mismatch'));
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('비밀값이 없으면 503으로 답하고 검증을 시도하지 않는다', async () => {
    vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');

    const response = await POST(webhookRequest({ paths: ['/column/새-글'] }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: 'service_unconfigured' });
    expect(verifyRootTaleWebhook).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test('서명 검증에 실패하면 401이고 무효화하지 않는다', async () => {
    verifyRootTaleWebhook.mockResolvedValue({ ok: false });

    const response = await POST(webhookRequest({ paths: ['/column/새-글'] }));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('본문이 JSON이 아니면 400이고 무효화하지 않는다', async () => {
    const response = await POST(webhookRequest('{'));

    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test('본문이 상한을 넘으면 413이고 검증을 시도하지 않는다', async () => {
    const response = await POST(
      webhookRequest({ paths: ['/column/새-글'] }, { 'content-length': String(64 * 1024 + 1) }),
    );

    expect(response.status).toBe(413);
    expect(verifyRootTaleWebhook).not.toHaveBeenCalled();
  });

  test('GET은 405와 함께 허용 메서드를 알린다', () => {
    const response = GET();

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });

  test('모든 응답은 캐시되지 않는다', async () => {
    const response = await POST(webhookRequest({ paths: ['/column/새-글'] }));

    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
