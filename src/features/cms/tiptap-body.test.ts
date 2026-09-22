import { afterEach, describe, expect, test, vi } from 'vitest';

import { renderTiptapBody } from './tiptap-body';

afterEach(() => {
  vi.unstubAllEnvs();
});

function imageDocument(src: string): Record<string, unknown> {
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: '앞' }] },
      { type: 'image', attrs: { src, alt: '칼럼' } },
      { type: 'paragraph', content: [{ type: 'text', text: '뒤' }] },
    ],
  };
}

describe('Tiptap 이미지 origin 정책', () => {
  test('임의 HTTPS 호스트 이미지만 빼고 주변 노드는 보존한다', () => {
    const html = renderTiptapBody(
      imageDocument('https://evil.example/tracker.png'),
      'column-richtext',
    );

    expect(html).toBe('<p>앞</p><p>뒤</p>');
  });

  test.each([
    ['배포 사이트', 'https://gwangju2020blog.madiclinic.co.kr/images/column.jpg'],
    ['기본 RootTale API', 'https://api.roottale.com/uploads/column.jpg'],
  ])('%s origin 이미지는 보존한다', (_label, src) => {
    vi.stubEnv('ROOTTALE_API_BASE', '');

    const html = renderTiptapBody(imageDocument(src), 'column-richtext');

    expect(html).toContain(`<img src="${src}" alt="칼럼"`);
    expect(html).toContain('<p>앞</p>');
    expect(html).toContain('<p>뒤</p>');
  });

  test('설정된 RootTale API origin 이미지는 보존한다', () => {
    vi.stubEnv('ROOTTALE_API_BASE', 'https://cms-assets.example/api');

    const html = renderTiptapBody(
      imageDocument('https://cms-assets.example/uploads/column.jpg'),
      'column-richtext',
    );

    expect(html).toContain('src="https://cms-assets.example/uploads/column.jpg"');
  });
});

describe('ROOT-ADMIN HTML 가져오기 본문', () => {
  test('importedHtml 원문은 공용 살균기를 거쳐 렌더한다', () => {
    const html = renderTiptapBody(
      {
        type: 'doc',
        content: [
          {
            type: 'importedHtml',
            attrs: {
              html: '<h2>가져온 본문</h2><p onclick="alert(1)">안전한 내용</p><script>alert(2)</script>',
            },
          },
        ],
      },
      'column-richtext',
    );

    expect(html).toContain('<div class="column-richtext__imported">');
    expect(html).toContain('<h2>가져온 본문</h2>');
    expect(html).toContain('안전한 내용');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('alert(');
  });

  test('HTML 입력의 미발행 예약 대상은 href 없는 문구로 렌더한다', () => {
    const token = '[[internal:faq.headache.migraine.aura-symptoms|편두통 전조증상]]';
    const html = renderTiptapBody(
      {
        type: 'doc',
        content: [{
          type: 'importedHtml',
          attrs: {
            html: `<p onclick="alert(1)">먼저 ${token}</p><script>alert(2)</script>`,
          },
        }],
      },
      'faq-richtext',
      new Map(),
    );

    expect(html).toContain(
      '<span data-internal-link-pending="faq.headache.migraine.aura-symptoms">편두통 전조증상</span>',
    );
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script');
  });

  test('HTML 입력의 예약 대상이 발행되면 현재 FAQ 경로로 연결한다', () => {
    const html = renderTiptapBody(
      {
        type: 'doc',
        content: [{
          type: 'importedHtml',
          attrs: {
            html: '<p>[[internal:faq.headache.migraine.aura-symptoms|편두통 전조증상]]</p>',
          },
        }],
      },
      'faq-richtext',
      new Map([
        ['faq.headache.migraine.aura-symptoms', '/faq/headache/migraine/aura-symptoms'],
      ]),
    );

    expect(html).toContain(
      '<p><a href="/faq/headache/migraine/aura-symptoms">편두통 전조증상</a></p>',
    );
  });
});

describe('Tiptap 문장부호', () => {
  test('텍스트 노드의 긴 대시를 렌더하지 않는다', () => {
    const html = renderTiptapBody(
      {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '앞 — 뒤' }] }],
      },
      'column-richtext',
    );

    expect(html).toBe('<p>앞  뒤</p>');
    expect(html).not.toContain('—');
  });
});

describe('Tiptap 예약 내부 링크', () => {
  const bodyJson = {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'text',
        text: '[[internal:faq.headache.migraine.aura-symptoms|편두통 전조증상]]',
        marks: [{ type: 'bold' }, { type: 'link', attrs: { href: '/reserved-404' } }],
      }],
    }],
  };

  test('대상이 미발행이면 링크 mark가 있어도 href를 만들지 않는다', () => {
    const html = renderTiptapBody(bodyJson, 'faq-richtext', new Map());

    expect(html).toContain('<strong><span data-internal-link-pending=');
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('reserved-404');
  });

  test('대상이 발행되면 같은 본문을 현재 FAQ 경로로 연결한다', () => {
    const html = renderTiptapBody(bodyJson, 'faq-richtext', new Map([
      ['faq.headache.migraine.aura-symptoms', '/faq/headache/migraine/aura-symptoms'],
    ]));

    expect(html).toContain(
      '<strong><a href="/faq/headache/migraine/aura-symptoms">편두통 전조증상</a></strong>',
    );
    expect(html).not.toContain('reserved-404');
  });
});


test('공통 서식 규칙으로 글씨 크기·문단 간격·사진 설명을 출력한다', () => {
  const html = renderTiptapBody({ type: 'doc', content: [
    { type: 'paragraph', attrs: { lineHeight: 1.8, paragraphSpacing: '24px' }, content: [{ type: 'text', text: '크기 확인', marks: [{ type: 'textStyle', attrs: { fontSize: '24px' } }] }] },
    { type: 'image', attrs: { src: 'https://gwangju2020blog.madiclinic.co.kr/photo.jpg', displayWidth: '50%', imageAlign: 'right', caption: '<script>사진</script>' } },
  ] }, 'column-richtext');
  expect(html).toContain('font-size:24px');
  expect(html).toContain('line-height:1.8');
  expect(html).toContain('margin-bottom:24px');
  expect(html).toContain('width:50%');
  expect(html).toContain('margin-left:auto');
  expect(html).toContain('<figcaption>&lt;script&gt;사진&lt;/script&gt;</figcaption>');
});

test('빈 편집 문단만 간격용으로 표시하고 문장 안 줄바꿈은 보존한다', () => {
  const html = renderTiptapBody({ type: 'doc', content: [
    { type: 'paragraph' },
    { type: 'paragraph', content: [{ type: 'hardBreak' }] },
    { type: 'paragraph', content: [{ type: 'text', text: '본문' }, { type: 'hardBreak' }] },
  ] }, 'column-richtext');
  expect(html.match(/data-cms-spacer="true"/g)).toHaveLength(2);
  expect(html).toContain('<p>본문<br></p>');
});

test('번호 목록의 시작 번호와 중첩 목록을 유지한다', () => {
  const html = renderTiptapBody({ type: 'doc', content: [
    { type: 'orderedList', attrs: { start: 3 }, content: [
      { type: 'listItem', content: [
        { type: 'paragraph', content: [{ type: 'text', text: '세 번째 항목' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '하위 항목' }] }] }] },
      ] },
    ] },
  ] }, 'column-richtext');
  expect(html).toContain('<ol start="3"><li><p>세 번째 항목</p><ul>');
});

test('제목의 고정 크기 마크는 반응형 위계를 따르고 일반 문단 크기는 유지한다', () => {
  const text = { type: 'text', text: '텍스트', marks: [{ type: 'textStyle', attrs: { fontSize: '32px' } }] };
  const html = renderTiptapBody({ type: 'doc', content: [
    { type: 'heading', attrs: { level: 2 }, content: [text] },
    { type: 'paragraph', content: [text] },
  ] }, 'column-richtext');
  expect(html).toContain('font-size:var(--rt-cms-heading-size, 32px)');
  expect(html).toContain('<p><span style="font-size:32px">');
});
