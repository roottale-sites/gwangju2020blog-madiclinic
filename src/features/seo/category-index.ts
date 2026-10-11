/**
 * 분류 색인 정책 전환 전에는 기존 사이트처럼 모든 공개 분류를 색인한다.
 * ROOT-ADMIN 운영 이관이 전환을 기록해 공개 분류 응답의 `category_index_activated`가
 * true가 된 뒤에만 `hub_promoted=false` 분류를 noindex·사이트맵 제외로 처리한다.
 * 배포 순서와 관계없이 기존 색인 분류가 갑자기 빠지지 않게 하는 계약이다.
 */
export function categoryNoindexFromWire(response: unknown, category: Record<string, unknown>): boolean | undefined {
  const activated = typeof response === 'object' && response !== null
    && (response as Record<string, unknown>).category_index_activated === true;
  if (!activated) return false;
  return typeof category.hub_promoted === 'boolean' ? !category.hub_promoted : undefined;
}
