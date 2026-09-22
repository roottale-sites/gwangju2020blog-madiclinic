import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { GET } from '../../app/api/exposures/route';

const fetchMock = vi.fn();
const wireDecision = {
  campaigns: [{
    id: 'popup-test', slot_key: 'site-popup', kind: 'popup', repeat: 'always', ends_at: null,
    content: { variant: 'card', title: '진료 안내' },
    delivery: { version: 2, time_zone: 'Asia/Seoul', delay_seconds: 0, scroll_percent: null,
      dismissible: true, hide_for_today: true, size: 'medium', day_boundary: 'calendar' },
  }],
  evaluated_at: '2026-09-22T00:00:00Z', valid_until: '2026-09-22T00:01:00Z',
  next_change_at: '2026-09-22T00:00:30Z', contract_version: 2, supported_features: [],
};

beforeEach(() => {
  vi.stubEnv('ROOTTALE_API_KEY', 'server-test-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.test');
  fetchMock.mockReset().mockImplementation(() => Promise.resolve(Response.json(wireDecision)));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

test.each(['/column', '/reviews', '/faq'])('커뮤니티 첫 화면 %s의 PC·모바일 팝업을 조회한다', async (path) => {
  for (const device of ['desktop', 'mobile']) {
    const response = await GET(new Request(`https://site.test/api/exposures?path=${path}&device=${device}`));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const body = await response.json();
    expect(body.campaigns[0]).toMatchObject({ slotKey: 'site-popup', content: { title: '진료 안내' } });
    expect(body.nextChangeAt).toBe('2026-09-22T00:00:30Z');
    const [url, init] = fetchMock.mock.lastCall!;
    expect(new URL(url).searchParams.get('slot_keys')).toBe('site-popup');
    expect(new URL(url).searchParams.get('path')).toBe(path);
    expect(new URL(url).searchParams.get('device')).toBe(device);
    expect(init.cache).toBe('no-store');
    expect(JSON.stringify(body)).not.toContain('server-test-key');
  }
});

test.each(['/', '/column/headache/post', '/faq/spine', '/preview/post/draft'])('%s에서는 팝업을 조회하지 않는다', async (path) => {
  const response = await GET(new Request(`https://site.test/api/exposures?path=${path}`));
  expect((await response.json()).campaigns).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each(['site_id=other', 'slot_keys=site-banner', 'path=//other.test', 'device=tablet', 'path=/column&path=/faq'])('조회 범위 변경과 잘못된 입력을 거부한다: %s', async (query) => {
  const response = await GET(new Request(`https://site.test/api/exposures?${query}`));
  expect(response.status).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('빈 캠페인은 성공으로 반환해 보관·종료한 팝업이 다시 나타나지 않는다', async () => {
  fetchMock.mockResolvedValue(Response.json({ ...wireDecision, campaigns: [] }));
  const response = await GET(new Request('https://site.test/api/exposures?path=/column'));
  expect(response.status).toBe(200);
  expect((await response.json()).campaigns).toEqual([]);
});

test.each(['', 'local_unconfigured'])('서버 키가 없으면 팝업 API만 비활성화한다 (%s)', async (key) => {
  vi.stubEnv('ROOTTALE_API_KEY', key);
  const response = await GET(new Request('https://site.test/api/exposures?path=/column'));
  expect(response.status).toBe(503);
  expect(fetchMock).not.toHaveBeenCalled();
});

test('CMS 장애 내용을 방문자에게 노출하지 않는다', async () => {
  fetchMock.mockRejectedValue(new Error('upstream server-test-key'));
  const response = await GET(new Request('https://site.test/api/exposures?path=/column'));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('server-test-key');
});
