import { describe, expect, test } from 'vitest';
import { metadataImageUrl, pageSeoMetadata, readCmsSeo } from './cms-metadata';

describe('CMS 검색·공유 입력', () => {
  test('빈 값과 잘못된 타입은 기본값으로 넘기고 true인 색인 설정만 읽는다', () => {
    expect(readCmsSeo({ seo: { title: '  ', description: 42, noindex: 'false', nofollow: true } }))
      .toMatchObject({ title: undefined, description: undefined, noindex: false, nofollow: true });
    expect(readCmsSeo({ seo: ['잘못된 형식'] })).toEqual({});
  });

  test.each(['javascript:alert(1)', 'data:image/png;base64,x', '//outside.test/a.png',
    '/\\outside.test/a.png', 'https://user:password@example.test/a.png', '잘못된 주소'])
  ('공유 이미지에 사용할 수 없는 주소를 거른다: %s', (url) => {
    expect(metadataImageUrl(url)).toBeUndefined();
  });

  test('사이트 상대 이미지와 Cloudflare 공유용 크기를 정규화한다', () => {
    expect(metadataImageUrl('/madi/img/sbn01.jpg'))
      .toBe('https://gwangju2020blog.madiclinic.co.kr/madi/img/sbn01.jpg');
    expect(metadataImageUrl('https://imagedelivery.net/hash/id/md'))
      .toBe('https://imagedelivery.net/hash/id/lg');
  });

  test('완전한 제목·설명·대체 텍스트가 검색·OG·Twitter에서 일치한다', () => {
    const metadata = pageSeoMetadata('/faq', {
      title: '관리자가 정한 전체 제목', description: '관리자가 정한 설명',
      imageUrl: 'https://images.example.test/og.png', imageAlt: '진료 안내', noindex: true,
    });
    expect(metadata.title).toEqual({ absolute: '관리자가 정한 전체 제목' });
    expect(metadata.description).toBe('관리자가 정한 설명');
    for (const social of [metadata.openGraph, metadata.twitter]) {
      expect(social).toMatchObject({
        title: '관리자가 정한 전체 제목', description: '관리자가 정한 설명',
        images: [{ url: 'https://images.example.test/og.png', alt: '진료 안내' }],
      });
    }
    expect(metadata.alternates?.canonical).toBe('/faq');
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
