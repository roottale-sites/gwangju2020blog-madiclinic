/**
 * 정적 초기 원장 → ROOT-ADMIN FAQ 발행 (headnerve `scripts/sync-faq-content.ts`).
 *
 *   pnpm cms:faq:sync -- --dry-run --site-id <site-id> --author-profile-id <id>
 *   pnpm cms:faq:sync -- --apply   --site-id <site-id> --author-profile-id <id>
 *
 * headnerve는 질환 화면의 검수 FAQ 71건을 이 스크립트로 옮겼다. 이 저장소의 초기
 * 원장(`fallbackFaqArchive`)은 비어 있다(PLAN.md §5.3) — 이관할 콘텐츠가 없기
 * 때문이다. 그래서 지금은 아무 것도 하지 않고 시트 가져오기(`pnpm cms:faq:sheet`)를
 * 안내한다. 계획·충돌 판정(`faq-import.ts`)은 그대로 살아 있으므로 정적 원장이
 * 생기면 이 스크립트가 바로 쓰인다.
 */
import {
  buildFaqCmsSeeds,
  planFaqCmsImport,
  type BoundFaqCmsSeed,
  type ManagedFaqPost,
} from '../src/features/faq/faq-import';
import { fallbackFaqArchive } from '../src/features/faq/faq-registry';
import {
  fetchFaqCategories,
  fetchFaqModel,
  type FaqWireCategory,
} from '../src/features/faq/faq-wire';
import {
  assertApiScopes,
  authorProfileId,
  bodyWithSite,
  clearLegacyDuplicatedBody,
  config,
  fetchApiScopes,
  fetchManagedFaqPosts,
  isRecord,
  publish,
  request,
  rollbackCreated,
} from './faq-cms-api';

function bindCategories(
  categories: readonly FaqWireCategory[],
): BoundFaqCmsSeed[] {
  const roots = new Map(
    categories.filter((category) => !category.parentId).map((category) => [category.slug, category]),
  );
  return buildFaqCmsSeeds(fallbackFaqArchive.entries).map((seed) => {
    const [sectionSlug, topicSlug] = seed.categoryPath;
    const root = roots.get(sectionSlug);
    const leaf = categories.find(
      (category) => category.parentId === root?.id && category.slug === topicSlug,
    );
    if (!root || !leaf) throw new Error(`FAQ 분류를 찾을 수 없습니다: ${sectionSlug}/${topicSlug}`);
    return { ...seed, categoryId: leaf.id };
  });
}

async function createDraft(seed: BoundFaqCmsSeed, authorId: string): Promise<ManagedFaqPost> {
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

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  if (process.argv.includes('--dry-run') && apply) throw new Error('--dry-run과 --apply를 함께 쓸 수 없습니다');
  if (fallbackFaqArchive.entries.length === 0) {
    console.log('이 저장소에는 정적 FAQ 초기 원장이 없습니다(PLAN.md §5.3).');
    console.log('시트에서 가져오려면 pnpm cms:faq:sheet -- --csv <파일>을 쓰세요.');
    return;
  }
  const scopes = await fetchApiScopes();
  assertApiScopes(scopes, ['cms:read']);
  const model = await fetchFaqModel(config());
  if (!model || model.basePath !== '/faq' || model.categoryDepth !== 2) {
    throw new Error('활성 faq category_tree 모델이 아직 배포되지 않았습니다');
  }
  const [categories, current] = await Promise.all([
    fetchFaqCategories(config()),
    fetchManagedFaqPosts(),
  ]);
  const desired = bindCategories(categories);
  const plan = planFaqCmsImport(desired, current);
  console.log(
    `FAQ ${desired.length}건 — 생성 ${plan.create.length}, 중복 본문 정리 ${plan.normalizeBody.length}, 발행 재개 ${plan.publish.length}, 유지 ${plan.unchanged.length}, 충돌 ${plan.conflicts.length}`,
  );
  if (plan.conflicts.length > 0) throw new Error(plan.conflicts.join('\n'));
  const writeScopes = [
    ...((plan.create.length > 0 || plan.normalizeBody.length > 0) ? ['post:draft:write'] : []),
    ...((plan.create.length > 0 || plan.publish.length > 0) ? ['post:publish'] : []),
  ];
  if (apply) assertApiScopes(scopes, writeScopes);
  if (!apply) {
    console.log('dry-run — 적용하려면 --apply를 추가하세요');
    return;
  }
  const authorId = authorProfileId();
  if (plan.create.length > 0 && !authorId) {
    throw new Error('새 글 생성에는 --author-profile-id 또는 ROOTTALE_FAQ_AUTHOR_PROFILE_ID가 필요합니다');
  }

  const created: ManagedFaqPost[] = [];
  try {
    for (const seed of plan.create) created.push(await createDraft(seed, authorId!));
    for (const post of plan.normalizeBody) await clearLegacyDuplicatedBody(post);
    for (const post of [...plan.publish, ...created]) await publish(post);
  } catch (error) {
    await rollbackCreated(created);
    throw error;
  }
  console.log(
    `FAQ 콘텐츠 동기화 완료 — 새 발행 ${created.length}, 중복 본문 정리 ${plan.normalizeBody.length}, 재개 ${plan.publish.length}`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
