import type { Metadata } from 'next';

import MadiNotFound from '../components/madi/MadiNotFound';

export const metadata: Metadata = {
  title: { absolute: '페이지를 찾을 수 없습니다 | 광주 남구 마디클리닉' },
  description:
    '요청하신 페이지를 찾을 수 없습니다. 블로그, 자주 묻는 질문, 후기 또는 병원 홈페이지에서 필요한 정보를 확인해 주세요.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <MadiNotFound />;
}
