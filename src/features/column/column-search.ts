import type { ColumnArchiveEntry } from './column-model';

/**
 * 제목·요약 인덱스의 비교 규칙. 목록과 검색이 같은 공백·대소문자 판정을 쓴다.
 */
function searchableText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('ko-KR');
}

/** 제목 또는 요약에 검색어가 있으면 목록에 남긴다. */
export function searchColumnArchiveEntries(
  entries: readonly ColumnArchiveEntry[],
  query: string,
): ColumnArchiveEntry[] {
  const normalizedQuery = searchableText(query);
  if (!normalizedQuery) return [...entries];

  return entries.filter((entry) =>
    searchableText(`${entry.title} ${entry.description}`).includes(normalizedQuery),
  );
}
