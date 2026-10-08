import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { SITE_PATTERNS_CACHE_TAG } from '@roottale/cms-client/server';

import seed from '../../../cms/column-footer-image.json';
import ColumnConsultationPhoto from './ColumnConsultationPhoto';
import { columnFooterImageFromBody, loadColumnFooterImage } from './column-footer-image';

const fetchMock = vi.fn<typeof fetch>();
const replacement = 'https://root-cdn.com/tenants/test/new-photo.webp';
const imageBody = (src: string, attrs: Record<string, unknown> = {}) => ({
  type: 'doc', content: [{ type: 'image', attrs: { src, alt: '새 진료실 사진', ...attrs } }],
});

function respond(body = imageBody(replacement), key = seed.key) {
  fetchMock.mockResolvedValue(Response.json({ patterns: [{
    id: 'footer', key, name: seed.name, body_json: body,
    updated_at: '2026-10-08T00:00:00Z',
  }] }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('ROOTTALE_API_KEY', 'test-key');
  vi.stubEnv('ROOTTALE_API_BASE', 'https://cms.example');
  vi.stubEnv('ROOTTALE_MEDIA_ORIGIN', 'https://root-cdn.com');
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('ROOT-ADMIN 공개 블록 응답의 교체 사진과 대체 텍스트를 표시한다', async () => {
  respond(imageBody(replacement, { width: 800, height: 1200 }));
  const image = await loadColumnFooterImage();
  const html = renderToStaticMarkup(<ColumnConsultationPhoto image={image} />);
  expect(html).toContain(`src="${replacement}"`);
  expect(html).toContain('alt="새 진료실 사진"');
  expect(html).toContain('width="800" height="1200"');
  expect(html).toContain('loading="lazy"');
  expect(html).not.toContain('clinic-consultation.webp');

  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe('https://cms.example/v1/cms/public/patterns');
  expect(init).toMatchObject({ next: { tags: [SITE_PATTERNS_CACHE_TAG], revalidate: 3600 } });
});

test('발행 해제·삭제로 공개 블록이 없어지면 기본 사진을 되살리지 않는다', async () => {
  fetchMock.mockResolvedValue(Response.json({ patterns: [] }));
  const image = await loadColumnFooterImage();
  expect(image).toBeNull();
  expect(renderToStaticMarkup(<ColumnConsultationPhoto image={image} />)).toBe('');
});

test('다른 공통 블록의 사진은 이 위치에 표시하지 않는다', async () => {
  respond(imageBody(replacement), 'unrelated-block');
  expect(await loadColumnFooterImage()).toBeNull();
});

test('블록에서 사진을 지우면 하단 사진도 숨긴다', () => {
  expect(columnFooterImageFromBody({ type: 'doc', content: [{ type: 'paragraph' }] })).toBeNull();
});

test('중첩된 첫 사진 한 장을 사용하며 크기 정보가 없으면 원본 비율에 맡긴다', () => {
  const image = columnFooterImageFromBody({ type: 'doc', content: [
    { type: 'paragraph', content: imageBody(replacement, { width: -1, height: 0, alt: '' }).content },
    ...imageBody('https://root-cdn.com/second.webp').content,
  ] });
  expect(image).toEqual({ src: replacement, alt: '' });
});

test.each(['javascript:alert(1)', 'data:image/svg+xml,unsafe', '//external.example/photo.jpg', 'https://external.example/photo.jpg'])(
  'CMS 이미지 신뢰 정책 밖의 주소는 표시하지 않는다: %s', (src) => {
    expect(columnFooterImageFromBody(imageBody(src))).toBeNull();
  },
);

test('초기 등록 자료는 기존 사진·설명·비율을 그대로 보존한다', () => {
  expect(columnFooterImageFromBody(seed.bodyJson)).toEqual(seed.bodyJson.content[0]!.attrs);
});

test('Cloudflare Images는 원본 주소에서 화면 크기에 맞는 변형을 제공한다', () => {
  const image = columnFooterImageFromBody(imageBody('https://imagedelivery.net/account/image/original'));
  const html = renderToStaticMarkup(<ColumnConsultationPhoto image={image} />);
  expect(html).toContain('src="https://imagedelivery.net/account/image/md"');
  expect(html).toContain('https://imagedelivery.net/account/image/lg 1600w');
});

test('CMS 장애에도 본문을 제공하고 오류에 담긴 인증 정보는 출력하지 않는다', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  fetchMock.mockRejectedValue(new Error('private-upstream-detail'));
  expect(await loadColumnFooterImage()).toBeNull();
  expect(warn).toHaveBeenCalledWith('블로그 하단 이미지를 불러오지 못했습니다.');
});

test('API 키가 없으면 CMS를 조회하지 않는다', async () => {
  vi.stubEnv('ROOTTALE_API_KEY', 'local_unconfigured');
  expect(await loadColumnFooterImage()).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});
