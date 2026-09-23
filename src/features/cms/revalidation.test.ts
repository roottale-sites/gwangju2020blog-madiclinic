import { describe, expect, test } from 'vitest';

import {
  readRevalidationPayload,
  readRevalidationPaths,
  revalidationPathsFor,
  revalidationTagsFor,
  revalidationTargetForModel,
  revalidationTargets,
  shouldRevalidate,
} from './revalidation';

describe('ROOT-ADMIN 웹훅 본문 파싱', () => {
  test('안전한 절대 경로만 읽는다', () => {
    const paths = readRevalidationPaths(JSON.stringify({
      paths: ['/column', '/column/새-글', '//attacker.example', 'column/missing-slash', 7],
    }));

    expect(paths).toEqual(['/column', '/column/새-글']);
  });

  test('역참조 판정에 필요한 글 ID와 모델 키를 함께 읽는다', () => {
    expect(readRevalidationPayload(JSON.stringify({
      paths: ['/faq/headache/migraine/target'],
      postId: 'post-target',
      modelKey: 'faq',
    }))).toEqual({
      paths: ['/faq/headache/migraine/target'],
      postId: 'post-target',
      modelKey: 'faq',
    });
  });

  test('깨진 JSON과 객체가 아닌 본문을 거부한다', () => {
    expect(readRevalidationPaths('{')).toBeNull();
    expect(readRevalidationPaths('null')).toBeNull();
  });

  test('paths가 없는 정상 이벤트는 빈 배열로 처리한다', () => {
    expect(readRevalidationPaths(JSON.stringify({ event: 'post.published' }))).toEqual([]);
  });
});

describe('갱신 대상 판정', () => {
  test('공개 모델 키를 사이트의 경로 계열과 연결한다', () => {
    expect(revalidationTargetForModel('column')).toBe('column');
    expect(revalidationTargetForModel('reviews')).toBe('reviews');
    expect(revalidationTargetForModel('faq')).toBe('faq');
    expect(revalidationTargetForModel('unknown')).toBeNull();
  });

  test('경로가 속한 컬렉션만 고른다', () => {
    expect(revalidationTargets('post.published', ['/column/새-글'])).toEqual(['column']);
    expect(revalidationTargets('post.published', ['/reviews/sample'])).toEqual(['reviews']);
    expect(revalidationTargets('post.published', ['/faq/headache/migraine/sample'])).toEqual(['faq']);
  });

  test('분류·테마 변경은 세 컬렉션을 모두 갱신한다', () => {
    expect(revalidationTargets('taxonomy.updated', [])).toEqual(['reviews', 'column', 'faq']);
    expect(revalidationTargets('theme.updated', [])).toEqual(['reviews', 'column', 'faq']);
  });

  test('두 컬렉션 경로가 함께 오면 둘 다 갱신한다', () => {
    expect(revalidationTargets('post.published', ['/reviews/a', '/column/b']))
      .toEqual(['reviews', 'column']);
  });

  test('관계없는 경로는 아무 것도 갱신하지 않는다', () => {
    expect(revalidationTargets('post.published', ['/about'])).toEqual([]);
    expect(shouldRevalidate('post.published', ['/about'])).toBe(false);
    expect(shouldRevalidate('post.published', ['/column'])).toBe(true);
  });

  test('접두사만 같은 경로를 컬렉션으로 오인하지 않는다', () => {
    expect(revalidationTargets('post.published', ['/column-sitemap.xml'])).toEqual([]);
    expect(revalidationTargets('post.published', ['/reviews-old'])).toEqual([]);
  });
});

describe('무효화 경로 구성', () => {
  test('칼럼은 목록과 자식·인덱스 사이트맵, RSS 피드를 항상 포함한다', () => {
    // 사이트맵·RSS도 24시간 캐시라 여기서 빼면 새 글이 하루 동안 안 잡힌다.
    expect(revalidationPathsFor('column', [])).toEqual([
      '/column',
      '/column-sitemap.xml',
      '/column/sitemap.xml',
      '/column/rss.xml',
      '/sitemap.xml',
    ]);
  });

  test('칼럼 상세 경로를 더한다', () => {
    expect(revalidationPathsFor('column', ['/column/새-글', '/reviews/other'])).toEqual([
      '/column',
      '/column-sitemap.xml',
      '/column/sitemap.xml',
      '/column/rss.xml',
      '/sitemap.xml',
      '/column/새-글',
    ]);
  });

  test('후기는 목록·사이트맵·RSS와 상세를 포함한다', () => {
    expect(revalidationPathsFor('reviews', ['/reviews/sample', '/column/other'])).toEqual([
      '/reviews',
      '/reviews-sitemap.xml',
      '/reviews/sitemap.xml',
      '/reviews/rss.xml',
      '/sitemap.xml',
      '/reviews/sample',
    ]);
  });

  test('중복 경로를 한 번만 남긴다', () => {
    expect(revalidationPathsFor('column', ['/column', '/column'])).toEqual([
      '/column',
      '/column-sitemap.xml',
      '/column/sitemap.xml',
      '/column/rss.xml',
      '/sitemap.xml',
    ]);
  });

  test('FAQ는 홈·사이트맵과 전달된 네 단계 경로를 갱신한다', () => {
    expect(revalidationPathsFor('faq', ['/faq/headache/migraine/sample', '/column/other'])).toEqual([
      '/faq',
      '/faq-sitemap.xml',
      '/faq/sitemap.xml',
      '/faq/rss.xml',
      '/sitemap.xml',
      '/faq/headache/migraine/sample',
    ]);
  });
});

describe('선택적 캐시 태그 구성', () => {
  test.each(['post.published', 'post.updated', 'post.deleted'])('%s 뒤에는 분류별 공개 글 수도 갱신한다', (event) => {
    expect(revalidationTagsFor('column', event, ['/column/headache/changed']))
      .toContain('column:categories');
  });
  test('글 이벤트는 목록과 정확한 상세 글 태그만 고른다', () => {
    expect(revalidationTagsFor('column', 'post.updated', [
      '/column',
      '/column/headache',
      '/column/headache/changed',
    ])).toEqual([
      'column:archive',
      'column:categories',
      'column:detail:changed',
    ]);
    expect(revalidationTagsFor('reviews', 'post.deleted', ['/reviews/changed']))
      .toEqual(['reviews:archive', 'reviews:detail:changed']);
    expect(revalidationTagsFor('faq', 'post.published', [
      '/faq/headache/migraine/changed',
      '/faq/headache/migraine/referrer',
    ])).toEqual([
      'faq:archive',
      'faq:detail:faq.headache.migraine.changed',
      'faq:detail:faq.headache.migraine.referrer',
    ]);
  });

  test('분류·테마 이벤트만 컬렉션 전체 태그를 고른다', () => {
    expect(revalidationTagsFor('faq', 'taxonomy.updated', [])).toEqual(['faq:all']);
    expect(revalidationTagsFor('column', 'theme.updated', [])).toEqual(['column:all']);
  });
});
