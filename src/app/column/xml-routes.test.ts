import { beforeEach, describe, expect, test, vi } from 'vitest';

const source = vi.hoisted(() => ({
  resolveColumnArchive: vi.fn(),
  resolveColumnCategories: vi.fn(),
}));

vi.mock('../../features/column/column-source', () => source);

import { GET as rss } from './rss.xml/route';
import { GET as sitemap } from './sitemap.xml/route';

beforeEach(() => {
  source.resolveColumnArchive.mockReset();
  source.resolveColumnCategories.mockReset();
  source.resolveColumnArchive.mockResolvedValue({ status: 'upstream', entries: [] });
  source.resolveColumnCategories.mockResolvedValue({ status: 'ok', categories: [] });
});

describe('칼럼 XML 라우트', () => {
  test.each([['RSS', rss], ['사이트맵', sitemap]])('CMS 장애 시 %s를 빈 XML로 캐시하지 않는다', async (_, handler) => {
    const response = await handler();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('300');
  });

  test('분류 조회에 실패하면 누락된 사이트맵을 제공하지 않는다', async () => {
    source.resolveColumnArchive.mockResolvedValue({ status: 'ok', entries: [] });
    source.resolveColumnCategories.mockResolvedValue({ status: 'upstream', categories: [] });
    const response = await sitemap();
    expect(response.status).toBe(503);
  });
});
