import { describe, expect, test } from 'vitest';

import { columnCategoryMetadata } from './ColumnCategoryPage';
import type { ColumnCategoryArchive } from './column-source';

const archive: ColumnCategoryArchive = {
  category: {
    slug: 'knee', name: '무릎', path: '/column/knee', description: '무릎 글',
    seoTitle: '무릎 통증 칼럼 | 검사와 치료 정보',
    seoDescription: '무릎 통증의 검사와 치료 글을 모았습니다.',
    publishedPostCount: 1,
  },
  categories: [],
  entries: [],
};

describe('칼럼 분류 메타데이터', () => {
  test('CMS SEO 제목을 전체 제목과 OG 제목으로 그대로 사용한다', () => {
    const metadata = columnCategoryMetadata(archive);
    expect(metadata.title).toEqual({ absolute: '무릎 통증 칼럼 | 검사와 치료 정보' });
    expect(metadata.openGraph).toMatchObject({
      title: '무릎 통증 칼럼 | 검사와 치료 정보',
      description: '무릎 통증의 검사와 치료 글을 모았습니다.',
      url: '/column/knee',
      images: ['https://gwangju2020blog.madiclinic.co.kr/opengraph-image.png'],
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['https://gwangju2020blog.madiclinic.co.kr/opengraph-image.png'],
    });
  });
});
