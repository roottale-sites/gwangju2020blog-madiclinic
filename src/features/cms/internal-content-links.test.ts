import { describe, expect, test } from 'vitest';

import {
  hasInternalContentLinkToken,
  internalContentLinkKeys,
  renderInternalContentLinks,
  renderInternalContentLinksInSanitizedHtml,
} from './internal-content-links';

const TOKEN = '[[internal:faq.headache.migraine.aura-symptoms|편두통 전조증상]]';

describe('예약 내부 콘텐츠 링크', () => {
  test('Tiptap과 HTML 입력에서 참조 키를 중복 없이 읽는다', () => {
    expect(internalContentLinkKeys({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: `${TOKEN} ${TOKEN}` }] },
        {
          type: 'importedHtml',
          attrs: { html: '<p>[[internal:faq.headache.migraine.future|미래 FAQ]]</p>' },
        },
      ],
    })).toEqual([
      'faq.headache.migraine.aura-symptoms',
      'faq.headache.migraine.future',
    ]);
  });

  test('미발행 키는 href 없는 일반 문구로 렌더한다', () => {
    const result = renderInternalContentLinks(`먼저 ${TOKEN}을 확인하세요.`, new Map());

    expect(result.hasTokens).toBe(true);
    expect(result.html).toContain('>편두통 전조증상</span>');
    expect(result.html).toContain('data-internal-link-pending="faq.headache.migraine.aura-symptoms"');
    expect(result.html).not.toContain('<a ');
    expect(result.html).not.toContain('href=');
  });

  test('발행 키는 현재 공개 경로를 사용하는 내부 링크로 렌더한다', () => {
    const paths = new Map([
      ['faq.headache.migraine.aura-symptoms', '/faq/headache/migraine/aura-symptoms'],
    ]);

    const result = renderInternalContentLinks(TOKEN, paths);

    expect(result.html).toBe(
      '<a href="/faq/headache/migraine/aura-symptoms">편두통 전조증상</a>',
    );
  });

  test('현재 FAQ 주소 계약의 한글 slug도 예약 키로 사용할 수 있다', () => {
    const koreanToken = '[[internal:faq.headache.migraine.전조증상-질문|관련 질문]]';
    const result = renderInternalContentLinks(koreanToken, new Map([
      ['faq.headache.migraine.전조증상-질문', '/faq/headache/migraine/전조증상-질문'],
    ]));

    expect(result.html).toBe(
      '<a href="/faq/headache/migraine/전조증상-질문">관련 질문</a>',
    );
  });

  test('외부 또는 프로토콜 상대 경로는 공개 링크로 만들지 않는다', () => {
    for (const path of ['https://evil.example', '//evil.example']) {
      const result = renderInternalContentLinks(TOKEN, new Map([
        ['faq.headache.migraine.aura-symptoms', path],
      ]));
      expect(result.html).not.toContain('<a ');
      expect(result.html).not.toContain('href=');
    }
  });

  test('Tiptap 텍스트 노드에서만 예약 토큰을 찾는다', () => {
    expect(hasInternalContentLinkToken({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: TOKEN }] }],
    })).toBe(true);
    expect(hasInternalContentLinkToken({
      type: 'image',
      attrs: { alt: TOKEN },
    })).toBe(false);
  });

  test('HTML 입력 노드의 본문 텍스트에서도 예약 토큰을 찾는다', () => {
    expect(hasInternalContentLinkToken({
      type: 'doc',
      content: [{
        type: 'importedHtml',
        attrs: { html: `<p>${TOKEN}</p>` },
      }],
    })).toBe(true);
    expect(hasInternalContentLinkToken({
      type: 'importedHtml',
      attrs: { html: `<span title="${TOKEN}">일반 문구</span><code>${TOKEN}</code>` },
    })).toBe(false);
  });

  test('정화된 HTML의 텍스트만 발행 경로로 연결하고 entity는 중복 이스케이프하지 않는다', () => {
    const token =
      '[[internal:faq.headache.migraine.aura-symptoms|두통 &amp; 어지럼증]]';
    const result = renderInternalContentLinksInSanitizedHtml(
      `<p>증상 &amp; 원인: ${token}</p>`,
      new Map([
        ['faq.headache.migraine.aura-symptoms', '/faq/headache/migraine/aura-symptoms'],
      ]),
    );

    expect(result.hasTokens).toBe(true);
    expect(result.html).toBe(
      '<p>증상 &amp; 원인: <a href="/faq/headache/migraine/aura-symptoms">두통 &amp; 어지럼증</a></p>',
    );
    expect(result.html).not.toContain('&amp;amp;');
  });

  test('HTML 속성·기존 링크·코드 예시의 예약 표기는 그대로 둔다', () => {
    const html = [
      `<span title="${TOKEN}">속성</span>`,
      `<a href="/already-linked">${TOKEN}</a>`,
      `<pre><code>${TOKEN}</code></pre>`,
    ].join('');

    const result = renderInternalContentLinksInSanitizedHtml(html, new Map());

    expect(result).toEqual({ html, hasTokens: false });
    expect(result.html.match(/<a /g)).toHaveLength(1);
    expect(result.html).not.toContain('data-internal-link-pending');
  });
});
