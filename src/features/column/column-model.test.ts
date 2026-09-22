import { describe, expect, test } from 'vitest';

import {
  columnArchiveEntryFromPost,
  columnEntryFromPost,
  columnEntryPath,
  columnPostDescription,
  isColumnPost,
  sortColumnEntries,
} from './column-model';
import type { ColumnPost } from './column-wire';

/**
 * headnerve의 `column-body`·`column-share-image`·`column-content` 테스트가 단정하던
 * 계약을 이 저장소의 픽스처로 다시 쓴 것이다. 이관 JSON 폴백·질환 링크·옛 게시판
 * 썸네일이 없어졌고, 본문 우선순위·정화·공유 이미지 정책·분류 계약은 그대로다.
 */
function post(overrides: Partial<ColumnPost> = {}): ColumnPost {
  return {
    id: '0193-post',
    type: 'post',
    collectionKey: 'column',
    slug: '무릎-통증',
    title: '무릎 통증의 원인',
    excerpt: '무릎 통증의 흔한 원인을 살펴봅니다.',
    publishedAt: '2026-09-15T00:00:00+09:00',
    bodyJson: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'JSON 본문' }] }],
    },
    bodyHtml: null,
    metaJson: {},
    terms: [{ taxonomy: 'category', slug: 'knee', name: '무릎' }],
    ...overrides,
  };
}

describe('칼럼 글 판별', () => {
  test('type·collectionKey가 모두 맞는 글만 칼럼이다', () => {
    expect(isColumnPost(post())).toBe(true);
    expect(isColumnPost(post({ collectionKey: 'reviews' }))).toBe(false);
    expect(isColumnPost(post({ type: 'page' }))).toBe(false);
    expect(isColumnPost(null)).toBe(false);
  });
});

describe('본문 우선순위와 정화', () => {
  test('서버 HTML이 있으면 그것을 쓰고 실행 코드는 지운다', () => {
    const entry = columnEntryFromPost(
      post({ bodyHtml: '<p>서버 HTML</p><script>alert(1)</script>' }),
    );

    expect(entry?.bodyHtml).toContain('서버 HTML');
    expect(entry?.bodyHtml).not.toContain('alert(1)');
    expect(entry?.bodyHtml).not.toContain('JSON 본문');
  });

  test('서버 HTML이 없으면 Tiptap 화이트리스트 렌더러로 그린다', () => {
    expect(columnEntryFromPost(post())?.bodyHtml).toContain('<p>JSON 본문</p>');
  });

  test('본문이 아예 없으면 빈 문자열이고 렌더가 깨지지 않는다', () => {
    const entry = columnEntryFromPost(post({ bodyHtml: '   ', bodyJson: {} }));

    expect(entry?.bodyHtml).toBe('');
  });
});

describe('메타 디스크립션', () => {
  test('CMS SEO 설명이 발췌문을 이긴다', () => {
    expect(columnPostDescription({ metaJson: { seo: { description: '검색 설명' } }, excerpt: '발췌' }))
      .toBe('검색 설명');
  });

  test('발췌문이 공백뿐이면 기본 문구까지 내려간다', () => {
    expect(columnPostDescription({ metaJson: {}, excerpt: '   ' }))
      .toBe('광주 남구 마디클리닉 이경무 대표원장이 쓰는 통증·비수술 치료 칼럼입니다.');
  });

  test('160자를 넘기지 않고 긴 대시는 지운다', () => {
    const description = columnPostDescription({ metaJson: {}, excerpt: `무릎—통증 ${'가'.repeat(300)}` });

    expect(description).toHaveLength(160);
    expect(description).not.toContain('—');
  });
});

describe('공유 이미지', () => {
  test('Cloudflare Images 대표 이미지는 미리보기 카드용 lg variant로 바꾼다', () => {
    const entry = columnEntryFromPost(
      post({ featuredImageUrl: 'https://imagedelivery.net/hash/image-id/md' }),
    );

    expect(entry?.shareImageUrl).toBe('https://imagedelivery.net/hash/image-id/lg');
  });

  test('대표 이미지가 없으면 본문 첫 사진을 쓴다', () => {
    const entry = columnEntryFromPost(
      post({
        bodyJson: {
          type: 'doc',
          content: [{ type: 'image', attrs: { src: 'https://root-cdn.com/tenants/t/media/photo.png' } }],
        },
      }),
    );

    expect(entry?.shareImageUrl).toBe('https://root-cdn.com/tenants/t/media/photo.png');
  });

  test('사이트 상대 경로는 절대 주소로 편다', () => {
    const entry = columnEntryFromPost(post({ featuredImageUrl: '/madi/img/sbn01.jpg' }));

    expect(entry?.shareImageUrl).toBe('https://gwangju2020blog.madiclinic.co.kr/madi/img/sbn01.jpg');
  });

  test('쓸 이미지가 없으면 필드를 두지 않고 사이트 기본 OG 이미지를 상속한다', () => {
    expect(columnEntryFromPost(post())).not.toHaveProperty('shareImageUrl');
  });
});

describe('분류 계약', () => {
  test('분류가 정확히 하나가 아니면 표시 모델을 만들지 않는다', () => {
    expect(columnEntryFromPost(post({ terms: [] }))).toBeNull();
    expect(columnArchiveEntryFromPost({ ...post(), terms: [] })).toBeNull();
  });

  test('플랫폼 원장 경로(path)가 있으면 조립하지 않고 그대로 쓴다 (ADR-0105)', () => {
    expect(columnEntryPath({ slug: '무릎-통증', path: '/column/knee/knee-pain', category: { slug: 'shoulder', name: '어깨', path: '/column/shoulder' } }))
      .toBe('/column/knee/knee-pain');
  });

  test('경로가 없으면 분류·slug로 3층 주소를 조립한다', () => {
    const entry = columnArchiveEntryFromPost({ ...post(), path: null });

    expect(entry && columnEntryPath(entry)).toBe('/column/knee/%EB%AC%B4%EB%A6%8E-%ED%86%B5%EC%A6%9D');
  });
});

describe('정렬', () => {
  test('발행일 내림차순으로 둔다', () => {
    const sorted = sortColumnEntries([
      { publishedAt: '2026-01-01T00:00:00+09:00' },
      { publishedAt: '2026-09-15T00:00:00+09:00' },
    ]);

    expect(sorted[0]?.publishedAt).toBe('2026-09-15T00:00:00+09:00');
  });
});

describe('복사 글 출처', () => {
  test('목록과 상세에 원문 출처를 유지한다', () => {
    const copiedFrom = { name: 'headnerve', url: 'https://headnerve.com/example' };
    const item = post({ metaJson: { copiedFrom } });
    expect(columnEntryFromPost(item)?.copiedFrom).toEqual(copiedFrom);
    expect(columnArchiveEntryFromPost(item)?.copiedFrom).toEqual(copiedFrom);
  });
  test('실행 가능한 주소를 출처 링크로 허용하지 않는다', () => {
    const item = post({ metaJson: { copiedFrom: { name: '출처', url: 'javascript:alert(1)' } } });
    expect(columnEntryFromPost(item)?.copiedFrom).toBeUndefined();
  });
});
