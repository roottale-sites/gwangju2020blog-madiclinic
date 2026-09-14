/**
 * `마디클리닉 FAQ` 시트(CSV) → ROOT-ADMIN FAQ 초안 가져오기 (추가 전용).
 *
 *   pnpm cms:faq:sheet -- --csv ./faq-입력.csv                    # dry-run
 *   pnpm cms:faq:sheet -- --csv ./faq-입력.csv --apply             # 초안 생성
 *   pnpm cms:faq:sheet -- --csv ./faq-입력.csv --apply --publish   # 생성 후 바로 발행
 *
 * - CSV는 시트에서 `파일 → 다운로드 → 쉼표로 구분된 값(.csv)`으로 받은 `FAQ 입력` 탭.
 * - 이미 CMS에 같은 주소(slug)의 글이 있으면 건드리지 않는다. 시트는 작성 원장,
 *   CMS는 발행 원장이며 덮어쓰기·삭제는 하지 않는다.
 * - "같이 많이 묻는 질문" 목록·`관련 질문(선택)` 열은 시트·CMS의 질문 제목과 맞춰
 *   본문 예약 토큰 `[[internal:faq.영역.질환.slug|질문]]`과 관련 콘텐츠 예약 키로 바꾼다.
 * - `발행일` 열은 관리 API가 과거 시각을 받지 않아 그대로 적용하지 못한다. `--publish`
 *   는 지금 시각으로 발행하며, 발행일 조정은 ROOT-ADMIN 편집 화면에서 한다.
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import type { ManagedFaqPost } from '../src/features/faq/faq-import';
import {
  planFaqSheetImport,
  readFaqSheetRows,
  type FaqSheetSeed,
} from '../src/features/faq/faq-sheet-import';
import { fetchFaqCategories, fetchFaqModel } from '../src/features/faq/faq-wire';
import {
  assertApiScopes,
  authorProfileId,
  bodyWithSite,
  config,
  fetchApiScopes,
  fetchManagedFaqPosts,
  isRecord,
  option,
  publish,
  request,
  rollbackCreated,
} from './faq-cms-api';

async function createDraft(seed: FaqSheetSeed, authorId: string): Promise<ManagedFaqPost> {
  const json = await request('/v1/cms/posts', {
    method: 'POST',
    body: JSON.stringify(bodyWithSite({
      model_key: 'faq',
      type: 'post',
      title: seed.title,
      slug: seed.slug,
      body_json: seed.bodyJson,
      excerpt: seed.excerpt,
      author_profile_id: authorId,
      category_ids: [seed.categoryId],
      field_values: seed.fieldValues,
    })),
  });
  if (!isRecord(json) || typeof json.id !== 'string') throw new Error(`${seed.slug}: 생성 응답에 id가 없습니다`);
  return {
    id: json.id,
    slug: seed.slug,
    status: 'draft',
    title: seed.title,
    excerpt: seed.excerpt,
    bodyJson: seed.bodyJson,
    fieldValues: seed.fieldValues,
    categoryIds: [seed.categoryId],
  };
}

async function setRelatedReservations(postId: string, keys: readonly string[]): Promise<void> {
  if (keys.length === 0) return;
  await request(`/v1/cms/posts/${encodeURIComponent(postId)}/related`, {
    method: 'PATCH',
    body: JSON.stringify(bodyWithSite({
      related_post_ids: [],
      reserved_keys: keys,
    })),
  });
}

function describeSeed(seed: FaqSheetSeed): string {
  const body = seed.bodyMode === 'empty' ? '본문 없음' : seed.bodyMode === 'importedHtml' ? 'HTML 입력' : '본문';
  return `${seed.rowNumber}행 ${seed.categoryPath.join('/')} · ${seed.slug}${seed.slugDerived ? '(파생)' : ''} · ${body} — ${seed.title}`;
}

async function main(): Promise<void> {
  const csvPath = option('--csv');
  if (!csvPath) throw new Error('--csv <시트 CSV 경로>가 필요합니다');
  const apply = process.argv.includes('--apply');
  const publishNow = process.argv.includes('--publish');
  if (process.argv.includes('--dry-run') && apply) throw new Error('--dry-run과 --apply를 함께 쓸 수 없습니다');

  const scopes = await fetchApiScopes();
  assertApiScopes(scopes, ['cms:read']);
  const model = await fetchFaqModel(config());
  if (!model || model.basePath !== '/faq' || model.categoryDepth !== 2) {
    throw new Error('활성 faq category_tree 모델을 찾을 수 없습니다');
  }
  const [categories, current, csv] = await Promise.all([
    fetchFaqCategories(config()),
    fetchManagedFaqPosts(),
    readFile(csvPath, 'utf8'),
  ]);
  const rows = readFaqSheetRows(csv);
  const plan = planFaqSheetImport({
    rows,
    categories,
    existing: current.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      categoryIds: post.categoryIds,
    })),
    scopeId: () => `rt-import-${randomUUID()}`,
  });

  console.log(`시트 ${rows.length}행 — 새로 만들 글 ${plan.create.length}, 이미 있는 글 ${plan.keep.length}, 오류 ${plan.errors.length}, 경고 ${plan.warnings.length}`);
  for (const seed of plan.create) console.log(`  + ${describeSeed(seed)}`);
  for (const { seed, post } of plan.keep) console.log(`  = ${seed.rowNumber}행 유지 · ${post.slug} (${post.status})`);
  for (const warning of plan.warnings) console.warn(`  ! ${warning}`);
  for (const error of plan.errors) console.error(`  x ${error}`);
  if (plan.errors.length > 0) throw new Error('오류가 있는 행을 고친 뒤 다시 실행하세요');

  if (!apply) {
    console.log('dry-run — 적용하려면 --apply를 추가하세요 (--publish를 붙이면 바로 발행)');
    return;
  }
  if (plan.create.length === 0) {
    console.log('새로 만들 글이 없습니다');
    return;
  }
  assertApiScopes(scopes, [
    'post:draft:write',
    ...(plan.create.some((seed) => seed.relatedContentKeys.length > 0) ? ['cms:write'] : []),
    ...(publishNow ? ['post:publish'] : []),
  ]);
  const authorId = authorProfileId();
  if (!authorId) throw new Error('새 글 생성에는 --author-profile-id 또는 ROOTTALE_FAQ_AUTHOR_PROFILE_ID가 필요합니다');

  const created: ManagedFaqPost[] = [];
  try {
    for (const seed of plan.create) {
      const post = await createDraft(seed, authorId);
      created.push(post);
      await setRelatedReservations(post.id, seed.relatedContentKeys);
    }
    if (publishNow) for (const post of created) await publish(post);
  } catch (error) {
    await rollbackCreated(created);
    throw error;
  }
  console.log(`가져오기 완료 — 초안 ${created.length}${publishNow ? ' (모두 발행)' : ''}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
