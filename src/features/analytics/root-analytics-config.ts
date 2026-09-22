import { fetchAnalyticsConfig } from '@roottale/cms-client/server';

export async function loadRootAnalyticsConfig() {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com';
  const siteId = process.env.NEXT_PUBLIC_ROOTTALE_SITE_ID?.trim();
  try {
    const config = await fetchAnalyticsConfig({ apiKey, siteId, baseUrl, revalidate: 60 });
    return { ...config, collectUrl: new URL('/v1/collect', baseUrl).toString() };
  } catch {
    console.warn('ROOT-ANALYTICS 설정을 불러오지 못했습니다.');
    // 외부 태그 설정 조회가 일시 실패해도 이미 발급된 사이트의 자체 수집은 유지한다.
    return siteId ? { siteId, tags: [], collectUrl: new URL('/v1/collect', baseUrl).toString() } : null;
  }
}
