import { fetchSitePatterns, SITE_PATTERNS_CACHE_TAG } from '@roottale/cms-client/server';

import { trustedImageUrl } from '../cms/raw-html';

/** ROOT-ADMIN 공통 블록. 초기 등록 내용은 cms/column-footer-image.json에 둔다. */
export const COLUMN_FOOTER_IMAGE_KEY = 'column-footer-image';

export type ColumnFooterImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

function dimension(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

/** 이 위치는 사진 한 장만 표시한다. 문단 안에 삽입한 이미지도 같은 순서로 찾는다. */
export function columnFooterImageFromBody(body: unknown): ColumnFooterImage | null {
  if (!body || typeof body !== 'object') return null;
  if (Reflect.get(body, 'type') === 'image') {
    const attrs: unknown = Reflect.get(body, 'attrs');
    if (!attrs || typeof attrs !== 'object') return null;
    const src = trustedImageUrl(Reflect.get(attrs, 'src'));
    if (!src) return null;
    const alt: unknown = Reflect.get(attrs, 'alt');
    const width = dimension(Reflect.get(attrs, 'width'));
    const height = dimension(Reflect.get(attrs, 'height'));
    return {
      src,
      alt: typeof alt === 'string' ? alt : '마디클리닉 블로그 하단 이미지',
      ...(width && height ? { width, height } : {}),
    };
  }
  const content: unknown = Reflect.get(body, 'content');
  if (!Array.isArray(content)) return null;
  for (const child of content) {
    const image = columnFooterImageFromBody(child);
    if (image) return image;
  }
  return null;
}

/** 발행된 블록만 읽는다. 비공개·삭제·이미지 제거는 사진 숨김으로 반영한다. */
export async function loadColumnFooterImage(): Promise<ColumnFooterImage | null> {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return null;
  try {
    const patterns = await fetchSitePatterns({
      apiKey,
      baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
      revalidate: 3600,
      tags: [SITE_PATTERNS_CACHE_TAG],
      signal: AbortSignal.timeout(5000),
    });
    const pattern = patterns.find((item) => item.key === COLUMN_FOOTER_IMAGE_KEY);
    return pattern ? columnFooterImageFromBody(pattern.bodyJson) : null;
  } catch {
    // CMS 오류·인증 정보는 HTML이나 로그에 노출하지 않고 글 본문을 계속 제공한다.
    console.warn('블로그 하단 이미지를 불러오지 못했습니다.');
    return null;
  }
}
