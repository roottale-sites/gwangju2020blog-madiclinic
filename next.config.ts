import type { NextConfig } from 'next';
import { mainSiteOrigin } from './src/data/nav';

/**
 * 커뮤니티 전용 서브도메인이라 자체 홈이 없다. 루트만 병원 홈페이지로 보낸다.
 *
 * 상태 코드는 `permanent: true`(=308)가 아니라 `statusCode: 301`이다.
 * PLAN.md §2.1이 문자 그대로 301을 요구한다. 두 키는 Next 타입상 상호
 * 배타라 같이 못 쓴다.
 */
const PERMANENT_301 = 301;

/**
 * `next dev`는 기본적으로 localhost 밖 origin의 dev 리소스 요청을 막는다.
 * 다른 기기(사내망·Tailscale)에서 개발 화면을 열면 HTML만 오고 클라이언트
 * 스크립트가 차단돼 메뉴 같은 동작이 죽는다. 허용 호스트는 개인 주소라
 * 저장소에 박지 않고 `.env.local`의 `NEXT_DEV_ALLOWED_ORIGINS`(쉼표 구분)로 받는다.
 */
const devAllowedOrigins = process.env.NEXT_DEV_ALLOWED_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  redirects: async () => [
    // ROOT-ADMIN 팝업 미리보기는 /#rt-exposure-preview=…를 iframe으로 연다.
    // 같은 origin의 /column으로 옮겨 fragment와 postMessage 연결을 유지한다.
    { source: '/', destination: '/column', permanent: false,
      has: [{ type: 'header', key: 'sec-fetch-dest', value: 'iframe' }] },
    { source: '/', destination: `${mainSiteOrigin}/`, statusCode: PERMANENT_301 },
  ],
  ...(devAllowedOrigins?.length ? { allowedDevOrigins: devAllowedOrigins } : {}),
};

export default nextConfig;
