import type { FaqEntry } from './faq-model';

export type FaqCmsSeed = {
  slug: string;
  title: string;
  excerpt: string;
  bodyJson: Record<string, unknown>;
  categoryPath: readonly [string, string];
  fieldValues: Record<string, unknown>;
};

export type BoundFaqCmsSeed = FaqCmsSeed & { categoryId: string };

export type ManagedFaqPost = {
  id: string;
  slug: string;
  status: string;
  title: string;
  excerpt: string | null;
  bodyJson: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  categoryIds: readonly string[];
};

export type FaqImportPlan = {
  create: readonly BoundFaqCmsSeed[];
  normalizeBody: readonly ManagedFaqPost[];
  publish: readonly ManagedFaqPost[];
  unchanged: readonly ManagedFaqPost[];
  conflicts: readonly string[];
};

function emptyTiptapDocument(): Record<string, unknown> {
  return { type: 'doc', content: [] };
}

function legacyDuplicatedAnswer(text: string): Record<string, unknown> {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}

export function buildFaqCmsSeeds(entries: readonly FaqEntry[]): FaqCmsSeed[] {
  const slugs = new Set<string>();
  return entries.map((entry, index) => {
    if (slugs.has(entry.slug)) {
      throw new Error(`FAQ CMS에서 중복되는 글 slug입니다: ${entry.slug}`);
    }
    slugs.add(entry.slug);
    return {
      slug: entry.slug,
      title: entry.question,
      excerpt: entry.answer,
      bodyJson: emptyTiptapDocument(),
      categoryPath: [entry.sectionSlug, entry.topicSlug],
      fieldValues: {
        classification: entry.intent,
        reviewed_at: entry.updatedAt.slice(0, 10),
        display_order: index + 1,
      },
    };
  });
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameSeedExceptBody(post: ManagedFaqPost, seed: BoundFaqCmsSeed): boolean {
  return post.title === seed.title &&
    post.excerpt === seed.excerpt &&
    post.categoryIds.length === 1 &&
    post.categoryIds[0] === seed.categoryId &&
    canonical(post.fieldValues) === canonical(seed.fieldValues);
}

function sameSeed(post: ManagedFaqPost, seed: BoundFaqCmsSeed): boolean {
  return sameSeedExceptBody(post, seed) &&
    canonical(post.bodyJson) === canonical(seed.bodyJson);
}

function hasLegacyDuplicatedAnswer(
  post: ManagedFaqPost,
  seed: BoundFaqCmsSeed,
): boolean {
  return sameSeedExceptBody(post, seed) &&
    canonical(post.bodyJson) === canonical(legacyDuplicatedAnswer(seed.excerpt));
}

export function planFaqCmsImport(
  desired: readonly BoundFaqCmsSeed[],
  current: readonly ManagedFaqPost[],
): FaqImportPlan {
  const currentBySlug = new Map<string, ManagedFaqPost>();
  const conflicts: string[] = [];
  for (const post of current) {
    if (currentBySlug.has(post.slug)) {
      conflicts.push(`${post.slug}: CMS에 같은 slug 글이 둘 이상 있습니다`);
      continue;
    }
    currentBySlug.set(post.slug, post);
  }

  const create: BoundFaqCmsSeed[] = [];
  const normalizeBody: ManagedFaqPost[] = [];
  const publish: ManagedFaqPost[] = [];
  const unchanged: ManagedFaqPost[] = [];
  for (const seed of desired) {
    const post = currentBySlug.get(seed.slug);
    if (!post) {
      create.push(seed);
      continue;
    }
    const isCurrentSeed = sameSeed(post, seed);
    const isLegacyDuplicate = hasLegacyDuplicatedAnswer(post, seed);
    if (!isCurrentSeed && !isLegacyDuplicate) {
      conflicts.push(`${seed.slug}: CMS 글이 초기 원장과 다릅니다`);
      continue;
    }
    if (isLegacyDuplicate) normalizeBody.push(post);
    if (post.status === 'draft') publish.push(post);
    else if (post.status === 'published') {
      if (isCurrentSeed) unchanged.push(post);
    }
    else conflicts.push(`${seed.slug}: 지원하지 않는 CMS 상태입니다 (${post.status})`);
  }
  for (const post of current) {
    if (!desired.some((seed) => seed.slug === post.slug)) {
      conflicts.push(`${post.slug}: 초기 원장에 없는 FAQ 글입니다`);
    }
  }
  return { create, normalizeBody, publish, unchanged, conflicts };
}
