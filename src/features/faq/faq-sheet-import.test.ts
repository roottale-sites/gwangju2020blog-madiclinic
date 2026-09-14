import { describe, expect, it } from 'vitest';

import {
  convertFaqDetailHtml,
  matchFaqQuestion,
  parseCsv,
  planFaqSheetImport,
  readFaqSheetRows,
  resolveFaqCategory,
  rewriteRelatedQuestionList,
} from './faq-sheet-import';
import { faqCategory } from './faq-fixture';
import type { FaqWireCategory } from './faq-wire';

/**
 * 시트 가져오기는 분류 이름·slug를 CMS 응답에서만 읽는다. 아래 트리는 테스트
 * 전용 값이고 제품 코드에는 분류가 없다(PLAN.md §4.2).
 */
const categories: FaqWireCategory[] = [
  faqCategory({ id: 'c-headache', parentId: null, slug: 'headache', name: '두통·편두통' }),
  faqCategory({ id: 'c-migraine', parentId: 'c-headache', slug: 'migraine', name: '편두통' }),
  faqCategory({ id: 'c-tension', parentId: 'c-headache', slug: 'tension', name: '긴장성 두통' }),
  faqCategory({ id: 'c-dizziness', parentId: null, slug: 'dizziness', name: '어지럼증' }),
  faqCategory({ id: 'c-bppv', parentId: 'c-dizziness', slug: 'bppv', name: '이석증' }),
];

const HEADER = '" 영역 (필수)"," 질환 (필수)"," 질문 (필수)"," 요약답변 (필수)"," 상세답변 (선택)"," 관점 (선택)","발행일 (필수)","주소 (선택)","관련 질문 (선택)"';

function csv(rows: string[]): string {
  return [HEADER, ...rows].join('\n');
}

const detailHtml = [
  '<p><strong>욱신거림</strong>만 적기보다 위치·빈도를 함께 기록하세요.</p>',
  '<h2>무엇부터 기록하나요?</h2>',
  '<ul><li><strong>위치</strong> — 어디가 아픈지</li><li>빈도</li></ul>',
  '<h2>같이 많이 묻는 질문</h2>',
  '<ul><li>편두통 전조 증상은 무엇인가요?</li><li>긴장성 두통은 어떻게 다른가요?</li><li>없는 질문입니다</li></ul>',
].join('\n');

describe('parseCsv / readFaqSheetRows', () => {
  it('따옴표 안 줄바꿈과 이중 따옴표를 셀 값으로 읽고 라벨의 괄호를 무시한다', () => {
    const rows = readFaqSheetRows(csv([
      '"두통·편두통","편두통","머리가 ""욱신""거리면?","요약 첫 줄\n둘째 줄","<p>상세</p>","관점","2026-08-18","aura-symptoms","긴장성 두통은 어떻게 다른가요?\n- 없는 질문"',
    ]));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      rowNumber: 2,
      section: '두통·편두통',
      topic: '편두통',
      question: '머리가 "욱신"거리면?',
      summary: '요약 첫 줄\n둘째 줄',
      detailHtml: '<p>상세</p>',
      perspective: '관점',
      publishedOn: '2026-08-18',
      slug: 'aura-symptoms',
      relatedQuestions: ['긴장성 두통은 어떻게 다른가요?', '없는 질문'],
    });
  });

  it('선택 열이 없는 원래 7열 시트도 읽는다', () => {
    const rows = readFaqSheetRows(
      '" 영역 (필수)"," 질환 (필수)"," 질문 (필수)"," 요약답변 (필수)"," 상세답변 (선택)"," 관점 (선택)","발행일 (필수)"\n' +
      '"어지럼증","이석증","이석증은 재발하나요?","재발할 수 있습니다.","","","2026-08-18"',
    );
    expect(rows[0]?.slug).toBe('');
    expect(rows[0]?.relatedQuestions).toEqual([]);
  });

  it('필수 열이 없으면 바로 알려 준다', () => {
    expect(() => readFaqSheetRows('"영역","질환","질문"\n"a","b","c"')).toThrow('요약답변');
  });

  it('parseCsv는 빈 줄을 버린다', () => {
    expect(parseCsv('a,b\n\n"c","d"\n')).toEqual([['a', 'b'], ['c', 'd']]);
  });
});

describe('resolveFaqCategory', () => {
  it('이름의 공백·가운뎃점 차이와 slug 입력을 모두 받는다', () => {
    expect(resolveFaqCategory(categories, '두통 편두통', '긴장성두통')?.topic.slug).toBe('tension');
    expect(resolveFaqCategory(categories, 'dizziness', 'bppv')?.topic.id).toBe('c-bppv');
    expect(resolveFaqCategory(categories, '두통·편두통', '이석증')).toBeNull();
  });
});

describe('convertFaqDetailHtml', () => {
  it('문단·제목·목록·강조를 Tiptap 문서로 바꾼다', () => {
    const { bodyJson, mode } = convertFaqDetailHtml(
      '<p><strong>굵게</strong> 보통 <a href="https://gwangju2020blog.madiclinic.co.kr/faq">링크</a></p><h2>제목</h2><ul><li>하나</li><li><em>둘</em></li></ul>',
      'scope-1',
    );
    expect(mode).toBe('tiptap');
    expect(bodyJson).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '굵게', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' 보통 ' },
            { type: 'text', text: '링크', marks: [{ type: 'link', attrs: { href: 'https://gwangju2020blog.madiclinic.co.kr/faq' } }] },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '제목' }] },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '하나' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '둘', marks: [{ type: 'italic' }] }] }] },
          ],
        },
      ],
    });
  });

  it('지원하지 않는 태그가 있으면 HTML 입력 블록으로 원문을 보존한다', () => {
    const { bodyJson, mode } = convertFaqDetailHtml('<p>a</p><table><tr><td>b</td></tr></table>', 'scope-2');
    expect(mode).toBe('importedHtml');
    expect(bodyJson).toEqual({
      type: 'doc',
      content: [{ type: 'importedHtml', attrs: { html: '<p>a</p><table><tr><td>b</td></tr></table>', css: '', scope: 'scope-2' } }],
    });
  });

  it('빈 상세 답변은 빈 문서다', () => {
    expect(convertFaqDetailHtml('  ', 'x')).toEqual({ bodyJson: { type: 'doc', content: [] }, mode: 'empty' });
  });
});

describe('rewriteRelatedQuestionList / matchFaqQuestion', () => {
  const targets = [
    { key: 'faq.headache.migraine.aura', question: '편두통 전조 증상은 무엇인가요?' },
    { key: 'faq.headache.tension.difference', question: '긴장성 두통은 어떻게 다른가요' },
  ];

  it('물음표·공백 차이를 무시하고 질문을 맞춘다', () => {
    expect(matchFaqQuestion(targets, '긴장성 두통은  어떻게 다른가요?')?.key).toBe('faq.headache.tension.difference');
    expect(matchFaqQuestion(targets, '모르는 질문')).toBeNull();
  });

  it('"같이 많이 묻는 질문" 목록만 예약 토큰으로 바꾸고 못 맞춘 항목은 남긴다', () => {
    const { bodyJson } = convertFaqDetailHtml(detailHtml, 's');
    const { doc, unmatched, linked } = rewriteRelatedQuestionList(bodyJson, targets, 'faq.headache.migraine.self');
    const lists = (doc.content as Array<Record<string, unknown>>).filter((block) => block.type === 'bulletList');
    // 첫 목록(기록 항목)은 그대로, 둘째 목록만 바뀐다.
    expect(JSON.stringify(lists[0])).toContain('어디가 아픈지');
    expect(JSON.stringify(lists[1])).toContain('[[internal:faq.headache.migraine.aura|편두통 전조 증상은 무엇인가요?]]');
    expect(JSON.stringify(lists[1])).toContain('[[internal:faq.headache.tension.difference|긴장성 두통은 어떻게 다른가요?]]');
    expect(JSON.stringify(lists[1])).toContain('없는 질문입니다');
    expect(unmatched).toEqual(['없는 질문입니다']);
    expect(linked).toEqual(['faq.headache.migraine.aura', 'faq.headache.tension.difference']);
  });
});

describe('planFaqSheetImport', () => {
  const rows = readFaqSheetRows(csv([
    `"두통·편두통","편두통","머리가 욱신거리면 무엇을 기록하나요?","요약","${detailHtml.replaceAll('"', '""')}","마디클리닉 관점","2026-08-18","pulsing-record","긴장성 두통은 어떻게 다른가요?"`,
    '"두통·편두통","편두통","편두통 전조 증상은 무엇인가요?","요약2","","","2026-08-19","aura",""',
    '"두통·편두통","긴장성 두통","긴장성 두통은 어떻게 다른가요?","요약3","<p>본문</p>","","2026-08-19","",""',
    '"두통·편두통","없는 질환","분류가 틀린 질문","요약4","","","2026-08-19","",""',
    '"어지럼증","이석증","이미 있는 질문","요약5","","","2026-08-19","existing",""',
  ]));

  const plan = planFaqSheetImport({
    rows,
    categories,
    existing: [
      { id: 'p-existing', slug: 'existing', title: '이미 있는 질문', status: 'published', categoryIds: ['c-bppv'] },
      { id: 'p-cms', slug: 'cms-only', title: 'CMS에만 있는 질문?', status: 'published', categoryIds: ['c-migraine'] },
    ],
    scopeId: (row) => `scope-${row.rowNumber}`,
  });

  it('분류를 못 찾은 행은 오류로 모으고 나머지는 계획한다', () => {
    expect(plan.errors).toEqual(['5행: 분류를 찾을 수 없습니다 — 두통·편두통 › 없는 질환']);
    expect(plan.create.map((seed) => seed.slug)).toEqual([
      'pulsing-record',
      'aura',
      '긴장성-두통은-어떻게-다른가요',
    ]);
    expect(plan.keep.map(({ post }) => post.id)).toEqual(['p-existing']);
  });

  it('주소가 비면 질문에서 만든 주소를 쓰고 경고한다', () => {
    const derived = plan.create[2]!;
    expect(derived.slugDerived).toBe(true);
    expect(derived.key).toBe('faq.headache.tension.긴장성-두통은-어떻게-다른가요');
    expect(plan.warnings).toContain('4행: 주소 열이 비어 질문에서 만든 주소를 씁니다 — 긴장성-두통은-어떻게-다른가요');
  });

  it('같은 시트의 질문과 CMS 제목을 본문 토큰·관련 예약 키로 잇는다', () => {
    const first = plan.create[0]!;
    expect(first.key).toBe('faq.headache.migraine.pulsing-record');
    expect(first.categoryId).toBe('c-migraine');
    expect(first.bodyMode).toBe('tiptap');
    expect(JSON.stringify(first.bodyJson)).toContain('[[internal:faq.headache.migraine.aura|편두통 전조 증상은 무엇인가요?]]');
    expect(JSON.stringify(first.bodyJson)).toContain(
      '[[internal:faq.headache.tension.긴장성-두통은-어떻게-다른가요|긴장성 두통은 어떻게 다른가요?]]',
    );
    expect(first.fieldValues).toEqual({
      clinic_perspective: '마디클리닉 관점',
    });
    expect(first.relatedContentKeys).toEqual([
      'faq.headache.tension.긴장성-두통은-어떻게-다른가요',
    ]);
    expect(first.warnings).toContain('같이 많이 묻는 질문을 시트·CMS에서 찾지 못해 문구만 남깁니다 — 없는 질문입니다');
    // CMS에만 있는 글도 관련 대상이 된다.
    expect(matchFaqQuestion(
      [{ key: 'faq.headache.migraine.cms-only', question: 'CMS에만 있는 질문?' }],
      'CMS에만 있는 질문',
    )?.key).toBe('faq.headache.migraine.cms-only');
  });

  it('CMS에 같은 주소 글이 있으면 만들지 않고 유지로 분류한다', () => {
    expect(plan.keep[0]?.seed.title).toBe('이미 있는 질문');
    expect(plan.warnings.some((warning) => warning.includes('제목 다름'))).toBe(false);
  });
});
