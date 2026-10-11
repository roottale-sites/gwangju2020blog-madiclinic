import { describe, expect, test } from 'vitest';
import { categoryNoindexFromWire } from './category-index';

describe('categoryNoindexFromWire', () => {
  test('전환 전이거나 구버전 응답이면 승격 여부와 관계없이 색인한다', () => {
    expect(categoryNoindexFromWire({}, { hub_promoted: false })).toBe(false);
    expect(categoryNoindexFromWire({ category_index_activated: false }, { hub_promoted: false })).toBe(false);
    expect(categoryNoindexFromWire(null, { hub_promoted: false })).toBe(false);
  });

  test('전환 뒤에는 승격하지 않은 분류만 검색에서 제외한다', () => {
    const response = { category_index_activated: true };
    expect(categoryNoindexFromWire(response, { hub_promoted: false })).toBe(true);
    expect(categoryNoindexFromWire(response, { hub_promoted: true })).toBe(false);
    expect(categoryNoindexFromWire(response, {})).toBeUndefined();
  });
});
