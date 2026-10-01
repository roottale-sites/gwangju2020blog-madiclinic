import {
  THEME_CACHE_TAG,
  fetchTheme,
  siteVerificationMetadata,
  type SiteVerificationMetadata,
} from '@roottale/cms-client/server';

/**
 * ROOT-ADMIN 설정 → 연동에서 저장한 Google·네이버 소유 확인 코드.
 * 저장하면 `theme.updated` 웹훅이 `THEME_CACHE_TAG`와 루트 layout을 갱신한다.
 */
const THEME_REVALIDATE_SECONDS = 3600;

/**
 * 조회 실패 때만 쓰는 마지막 확인 값. 소유 확인이 일시 장애로 끊기지 않게 두며,
 * 정상 조회에서 코드가 비어 있으면 관리자 설정을 따라 태그를 내지 않는다.
 */
const FALLBACK_VERIFICATION: SiteVerificationMetadata = {
  google: ['wqorcvLgTNUDn2rwq8W3CwcDf-nYDDy1M5EGqf0GJAQ'],
  other: { 'naver-site-verification': ['1a28adccd316a7a4418eeada6e3c2528fe7813ff'] },
};

export async function loadSiteVerification(): Promise<SiteVerificationMetadata | undefined> {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return FALLBACK_VERIFICATION;
  try {
    const theme = await fetchTheme({
      apiKey,
      baseUrl: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
      siteId: process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim() || undefined,
      tags: [THEME_CACHE_TAG],
      revalidate: THEME_REVALIDATE_SECONDS,
    });
    return siteVerificationMetadata(theme.siteVerification);
  } catch {
    console.warn('검색엔진 소유 확인 코드를 불러오지 못해 마지막 확인 값을 사용합니다.');
    return FALLBACK_VERIFICATION;
  }
}
