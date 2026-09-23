import type { MetadataRoute } from 'next';

import { siteUrl } from '../data/site';

/** 공개 경로만 허용하고 미리보기는 크롤링하지 않는다. 사이트맵은 단일 인덱스로 안내한다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/preview/' },
    sitemap: siteUrl('/sitemap.xml'),
  };
}
