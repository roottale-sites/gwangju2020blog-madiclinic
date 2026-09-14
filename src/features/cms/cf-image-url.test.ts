import { describe, expect, it } from 'vitest';

import { cfImageSrcSet, cfImageVariantUrl, isCfImageUrl } from './cf-image-url';

describe('Cloudflare Images URL helpers', () => {
  const source = 'https://imagedelivery.net/account-hash/image-id/lg';

  it('Cloudflare Images delivery URL만 판정한다', () => {
    expect(isCfImageUrl(source)).toBe(true);
    expect(isCfImageUrl('https://images.example.com/review.jpg')).toBe(false);
  });

  it('variant와 srcset을 같은 원본에서 만든다', () => {
    expect(cfImageVariantUrl(source, 'md'))
      .toBe('https://imagedelivery.net/account-hash/image-id/md');
    expect(cfImageSrcSet(source))
      .toBe('https://imagedelivery.net/account-hash/image-id/sm 320w, https://imagedelivery.net/account-hash/image-id/md 768w, https://imagedelivery.net/account-hash/image-id/lg 1600w');
  });
});
