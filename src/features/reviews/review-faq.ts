import type { CmsPostContent } from '@roottale/cms-client/server';

import { removeEmDashes } from '../cms/content-text';

export type ReviewFaqItem = Readonly<{
  question: string;
  answer: string;
}>;

function textFromNode(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const node = value as Record<string, unknown>;
  const text = typeof node.text === 'string' ? node.text : '';
  const children = Array.isArray(node.content) ? node.content.map(textFromNode).join('') : '';
  return text + children;
}

function firstDescendantText(value: unknown, type: string): string | null {
  if (!value || typeof value !== 'object') return null;
  const node = value as Record<string, unknown>;
  if (node.type === type) {
    const text = removeEmDashes(textFromNode(node)).trim();
    return text || null;
  }

  const children = Array.isArray(node.content) ? node.content : [];
  for (const child of children) {
    const text = firstDescendantText(child, type);
    if (text) return text;
  }
  return null;
}

function faqItemsFromBody(value: unknown): ReviewFaqItem[] {
  if (!value || typeof value !== 'object') return [];
  const node = value as Record<string, unknown>;
  const children = Array.isArray(node.content) ? node.content : [];
  const nested = children.flatMap(faqItemsFromBody);
  if (node.type !== 'faqItem') return nested;

  const question = firstDescendantText(node, 'faqQuestion');
  const answer = firstDescendantText(node, 'faqAnswer');
  return question && answer ? [{ question, answer }, ...nested] : nested;
}

/** CMS 본문을 FAQ의 단일 원장으로 사용한다. */
export function reviewFaqItems(post: CmsPostContent): readonly ReviewFaqItem[] {
  return faqItemsFromBody(post.bodyJson);
}
