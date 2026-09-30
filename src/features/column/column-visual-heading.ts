import { isTag, isText, type ChildNode } from 'domhandler';
import { parseDocument } from 'htmlparser2';

type TextStyle = { size: number; bold: boolean };

function headingTextSizes(node: ChildNode, inherited: TextStyle): number[] {
  if (isText(node)) {
    return node.data.trim() ? [inherited.bold ? inherited.size : 0] : [];
  }
  if (!isTag(node)) return [];
  // 링크나 이미지가 섞인 문단은 탐색용 제목으로 취급하지 않는다.
  if (node.name === 'a' || node.name === 'img') return [0];

  const style = node.attribs.style ?? '';
  const size = /(?:^|;)\s*font-size\s*:\s*(\d+(?:\.\d+)?)px\s*(?:;|$)/i.exec(style);
  const weight = /(?:^|;)\s*font-weight\s*:\s*(bold|normal|\d+)\s*(?:;|$)/i.exec(style)?.[1];
  const current: TextStyle = {
    size: size ? Number(size[1]) : inherited.size,
    bold: weight ? weight === 'bold' || Number(weight) >= 600
      : inherited.bold || node.name === 'strong' || node.name === 'b',
  };
  return node.children.flatMap((child) => headingTextSizes(child, current));
}

/** CMS의 제목 태그 대신 모든 글자를 24px 이상 굵게 작성한 독립 문단. */
export function visualParagraphHeadingLevel(html: string): 2 | 3 | null {
  if (!/font-size\s*:/i.test(html)) return null;
  const sizes = parseDocument(html).children.flatMap((node) =>
    headingTextSizes(node, { size: 0, bold: false }));
  const smallestSize = sizes.length ? Math.min(...sizes) : 0;
  return smallestSize >= 32 ? 2 : smallestSize >= 24 ? 3 : null;
}
