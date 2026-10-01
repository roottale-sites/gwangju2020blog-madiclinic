import { DomUtils, parseDocument } from 'htmlparser2';

/** 일반 텍스트를 RSS의 HTML 본문에 넣을 때 마크업으로 해석되지 않게 한다. */
export function rssParagraph(text: string): string {
  const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return text.trim() ? `<p>${escaped}</p>` : '';
}

/** 화면용 정화가 끝난 HTML의 상대 주소를 원문 페이지 기준 절대 주소로 바꾼다. */
export function rssContentHtml(html: string, articleUrl: string): string {
  const document = parseDocument(html);
  for (const element of DomUtils.findAll(
    (node) => node.name === 'a' || node.name === 'img', document.children,
  )) {
    const attribute = element.name === 'a' ? 'href' : 'src';
    const value = element.attribs[attribute];
    if (!value) continue;
    try {
      element.attribs[attribute] = new URL(value, articleUrl).href;
    } catch {
      delete element.attribs[attribute];
    }
  }
  return DomUtils.getOuterHTML(document, { encodeEntities: 'utf8' });
}
