import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '../styles/tokens.css';
import '../styles/madi/header.css';
import '../styles/madi/patterns.css';
import '../styles/madi/navigation.css';
import '../styles/site/community.css';
import '../styles/site/archive-pagination.css';
import '../styles/site/archive-toolbar.css';
import '../styles/site/article-reading.css';
import '../styles/site/internal-links.css';
import '../styles/site/article-header.css';
import '../styles/site/article-navigation.css';
import '../styles/site/preferred-source.css';
import '../styles/site/image-lightbox.css';
import JsonLd from '../components/site/JsonLd';
import SiteLayout from '../components/site/SiteLayout';
import { clinic } from '../data/clinic';
import { siteOrigin } from '../data/site';
import { siteEntityJsonLd } from '../features/seo/schema';
import { RootAnalytics } from '../features/analytics/RootAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  /**
   * 하위 페이지는 `%s | 광주 남구 마디클리닉 블로그`가 된다. template 없이 두면
   * 페이지 title이 사이트 이름을 덮어써 `칼럼`만 남는다.
   */
  title: {
    default: '광주 남구 마디클리닉 블로그',
    template: '%s | 광주 남구 마디클리닉 블로그',
  },
  description:
    '광주 남구 마디클리닉의 칼럼·치료후기·자주 묻는 질문. 영상유도하 통증중재시술 의료기관, 이경무 대표원장 진료. 광주광역시 남구 독립로 14.',
  applicationName: clinic.name,
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#5bbad5' }],
  },
  robots: { index: true, follow: true },
  openGraph: {
    locale: 'ko_KR',
    siteName: `${clinic.name} 블로그`,
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

/**
 * 글꼴은 `src/styles/madi/header.css`가 선언한다(원본 baseStyle.css의
 * `@import` + `@font-face` + body font-family를 그대로 옮긴 것). 여기서는
 * 연결만 미리 열어 첫 렌더의 글꼴 교체를 줄인다.
 *
 * 자체 클릭·유입 수집은 RootAnalytics가 연결한다. 외부 태그는 ROOT-ADMIN 설정을 따른다.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <JsonLd nodes={siteEntityJsonLd} />
        <SiteLayout>{children}</SiteLayout>
        <RootAnalytics />
      </body>
    </html>
  );
}
