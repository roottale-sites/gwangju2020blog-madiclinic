import { describe, expect, test } from 'vitest';

import type { ColumnArchiveEntry } from './column-model';
import { searchColumnArchiveEntries } from './column-search';

const entries: readonly ColumnArchiveEntry[] = [
  {
    slug: 'title-match',
    title: '무릎 통증은 왜 생길까요?',
    description: '무릎 통증 정보',
    publishedAt: '2026-08-12T00:00:00+09:00',
    category: { slug: 'knee', name: '무릎', path: '/column/knee' },
  },
  {
    slug: 'body-match',
    title: '건강 이야기',
    description: '인대증식술은 손상된 인대를 회복시킵니다.',
    publishedAt: '2026-08-11T00:00:00+09:00',
    category: { slug: 'shoulder', name: '어깨', path: '/column/shoulder' },
  },
];

describe('칼럼 검색', () => {
  test('제목과 요약을 함께 검색한다', () => {
    expect(searchColumnArchiveEntries(entries, '무릎').map((entry) => entry.slug)).toEqual(['title-match']);
    expect(searchColumnArchiveEntries(entries, '인대증식술').map((entry) => entry.slug)).toEqual(['body-match']);
  });
});
