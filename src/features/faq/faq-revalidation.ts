import { faqInternalLinkKeyFromPath } from './faq-cache';
import { faqEntryPath, type FaqEntry } from './faq-model';

export type ChangedFaqContent = {
  readonly paths: readonly string[];
  readonly postId?: string;
};

/**
 * 변경된 FAQ와 이를 명시적으로 참조하는 FAQ 상세 경로만 고른다.
 * 목록·허브·사이트맵은 공통 revalidation 정책이 별도로 책임진다.
 *
 * headnerve `features/faq/faq-revalidation.ts` 그대로이며, 예약 키 역변환만
 * `faq-cache.ts`에서 읽는다(정적 진료 영역 목록이 없다).
 */
export function affectedFaqDetailPaths(
  entries: readonly FaqEntry[],
  changed: ChangedFaqContent,
): string[] {
  const changedKeys = new Set(
    changed.paths.flatMap((path) => faqInternalLinkKeyFromPath(path) ?? []),
  );
  const affected = new Set(
    changed.paths.filter((path) => faqInternalLinkKeyFromPath(path) !== null),
  );

  for (const entry of entries) {
    const referencesChangedId = Boolean(
      changed.postId && entry.relatedContentIds?.includes(changed.postId),
    );
    const referencedKeys = [
      ...(entry.relatedContentKeys ?? []),
      ...(entry.referencedContentKeys ?? []),
    ];
    const referencesChangedKey = referencedKeys.some((key) => changedKeys.has(key));
    if (referencesChangedId || referencesChangedKey) affected.add(faqEntryPath(entry));
  }

  return [...affected];
}
