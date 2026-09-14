export type CfImageVariant = 'thumbnail' | 'sm' | 'md' | 'lg';

const CF_IMAGE_HOST = 'imagedelivery.net';
const CF_IMAGE_VARIANT_WIDTH: Record<Exclude<CfImageVariant, 'thumbnail'>, number> = {
  sm: 320,
  md: 768,
  lg: 1600,
};

function cfImageUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    const path = url.pathname.split('/').filter(Boolean);
    return url.protocol === 'https:' && url.hostname === CF_IMAGE_HOST && path.length >= 3
      ? url
      : null;
  } catch {
    return null;
  }
}

/** Cloudflare Images delivery URL만 콘텐츠 이미지로 허용한다. */
export function isCfImageUrl(value: string): boolean {
  return cfImageUrl(value) !== null;
}

/** 같은 Cloudflare Images 원본의 용도별 variant URL을 만든다. */
export function cfImageVariantUrl(value: string, variant: CfImageVariant): string {
  const url = cfImageUrl(value);
  if (!url) return value;

  const [accountHash, imageId] = url.pathname.split('/').filter(Boolean);
  url.pathname = `/${accountHash}/${imageId}/${variant}`;
  return url.toString();
}

/** 카드·본문에서 브라우저가 알맞은 Cloudflare Images 크기를 고르게 한다. */
export function cfImageSrcSet(value: string): string | undefined {
  if (!isCfImageUrl(value)) return undefined;
  return (Object.entries(CF_IMAGE_VARIANT_WIDTH) as Array<[
    keyof typeof CF_IMAGE_VARIANT_WIDTH,
    number,
  ]>)
    .map(([variant, width]) => `${cfImageVariantUrl(value, variant)} ${width}w`)
    .join(', ');
}
