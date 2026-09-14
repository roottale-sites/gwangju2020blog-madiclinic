import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '../styles/madi/header.css';

export const metadata: Metadata = {
  title: '광주 남구 마디클리닉 블로그',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
