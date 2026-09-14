import { renderTiptapBody } from '../cms/tiptap-body';
import { removeEmDashes } from '../cms/content-text';

export type ReviewRelatedCopy = {
  eyebrow: string;
  label: string;
};

function paragraphText(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Reflect.get(value, 'type') !== 'paragraph') {
    return null;
  }
  const content = Reflect.get(value, 'content');
  if (!Array.isArray(content)) return null;
  const text = content
    .map((node) => node && typeof node === 'object' && typeof Reflect.get(node, 'text') === 'string'
      ? String(Reflect.get(node, 'text'))
      : '')
    .join('')
    .trim();
  return text ? removeEmDashes(text) : null;
}

function relatedPanelStart(content: readonly unknown[]): number {
  return content.findIndex((node, index) => {
    const eyebrow = paragraphText(node);
    const label = paragraphText(content[index + 1]);
    return eyebrow?.startsWith('▶ 연관 ') && label?.endsWith('→');
  });
}

function withoutFaqBlocks(content: readonly unknown[]): readonly unknown[] {
  return content.filter((node) => (
    !node || typeof node !== 'object' || Reflect.get(node, 'type') !== 'faq'
  ));
}

/**
 * Legacy review imports lost the anchor around their two-paragraph related-record
 * panel. Preserve its authored copy so the detail route can reconnect it to the
 * adjacent CMS record instead of hard-coding a single migrated slug.
 */
export function reviewRelatedCopy(bodyJson: Record<string, unknown>): ReviewRelatedCopy | null {
  const content = bodyJson.content;
  if (!Array.isArray(content)) return null;
  const start = relatedPanelStart(content);
  if (start < 0) return null;
  return {
    eyebrow: paragraphText(content[start])!,
    label: paragraphText(content[start + 1])!,
  };
}

export type ReviewBodySections = {
  beforeRelatedHtml: string;
  afterRelatedHtml: string;
  relatedCopy: ReviewRelatedCopy | null;
};

type ReviewBodyRenderOptions = Readonly<{
  omitLeadingImage?: boolean;
}>;

/** Sanitizes both sides independently so the migrated panel can retain its authored position. */
export function renderReviewBodySections(
  bodyJson: Record<string, unknown>,
  { omitLeadingImage = false }: ReviewBodyRenderOptions = {},
): ReviewBodySections {
  const content = bodyJson.content;
  if (!Array.isArray(content)) {
    return {
      beforeRelatedHtml: renderTiptapBody(bodyJson, 'review-richtext'),
      afterRelatedHtml: '',
      relatedCopy: null,
    };
  }

  const contentWithoutLeadImage = omitLeadingImage && content[0] && typeof content[0] === 'object'
    && Reflect.get(content[0], 'type') === 'image'
    ? content.slice(1)
    : content;
  const bodyContent = withoutFaqBlocks(contentWithoutLeadImage);
  const start = relatedPanelStart(bodyContent);
  if (start < 0) {
    return {
      beforeRelatedHtml: renderTiptapBody({ ...bodyJson, content: bodyContent }, 'review-richtext'),
      afterRelatedHtml: '',
      relatedCopy: null,
    };
  }

  const render = (nodes: readonly unknown[]) => renderTiptapBody(
    { ...bodyJson, content: nodes },
    'review-richtext',
  );
  return {
    beforeRelatedHtml: render(bodyContent.slice(0, start)),
    afterRelatedHtml: render(bodyContent.slice(start + 2)),
    relatedCopy: {
      eyebrow: paragraphText(bodyContent[start])!,
      label: paragraphText(bodyContent[start + 1])!,
    },
  };
}

/** 후기 본문의 패널 마커를 제외한 안전한 HTML 전체. */
export function renderReviewBody(bodyJson: Record<string, unknown>): string {
  const sections = renderReviewBodySections(bodyJson);
  return sections.beforeRelatedHtml + sections.afterRelatedHtml;
}
