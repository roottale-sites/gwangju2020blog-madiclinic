import { createRedirectMiddleware } from '@roottale/cms-renderer-next/routes';
import { NextRequest, NextResponse } from 'next/server';

import { siteOrigin } from './data/site';
import { isNonCanonicalHost } from './features/seo/preview-noindex';

const canonicalHost = new URL(siteOrigin).hostname;
const wwwHost = `www.${canonicalHost}`;
const redirectApiKey = process.env.ROOTTALE_API_KEY?.trim();
const redirects = redirectApiKey && redirectApiKey !== 'local_unconfigured'
  ? createRedirectMiddleware({
      apiKey: redirectApiKey,
      apiBase: process.env.ROOTTALE_API_BASE?.trim() || undefined,
      siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim() || undefined,
    })
  : null;

function redirectResponseForRequest(
  response: Response,
  requestOrigin: string,
  addNoindex: boolean,
): NextResponse {
  const headers = new Headers(response.headers);
  const location = headers.get('location');
  if (location) {
    const destination = new URL(location, requestOrigin);
    if (destination.hostname.toLowerCase() === wwwHost) destination.hostname = canonicalHost;
    headers.set('location', destination.toString());
  }
  if (addNoindex) headers.set('X-Robots-Tag', 'noindex, follow');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Next.js 16의 요청 경계에서 ROOT-ADMIN 주소 이동과 운영 도메인 정규화를 처리한다.
 *
 * 주소 이동을 먼저 판정하면 `www 구주소`도 apex의 최종 새 주소로 한 번에 보낼 수
 * 있다. 규칙이 없거나 API 조회가 실패하면 기존 라우팅으로 통과시키며, 운영
 * 도메인 외 응답에는 검색 색인 방지 헤더를 유지한다.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const requestHost = request.headers.get('host');
  const hostname = requestHost?.split(':', 1)[0] ?? request.nextUrl.hostname;
  const nonCanonicalHost = isNonCanonicalHost(hostname);

  if (redirects) {
    const redirectResponse = await redirects(request);
    if (redirectResponse) {
      return redirectResponseForRequest(
        redirectResponse,
        request.nextUrl.origin,
        nonCanonicalHost && hostname.toLowerCase() !== wwwHost,
      );
    }
  }

  if (hostname.toLowerCase() === wwwHost) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = canonicalHost;

    return NextResponse.redirect(canonicalUrl, 301);
  }

  const response = NextResponse.next();

  if (nonCanonicalHost) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  return response;
}
