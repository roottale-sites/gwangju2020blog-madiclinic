import { describe, expect, test } from 'vitest';

import { buildColumnDocument } from './column-document';

describe('칼럼 목차 문서', () => {
  test('h2와 h3에 앵커를 붙이고 계층과 텍스트를 목차로 만든다', () => {
    const document = buildColumnDocument(
      '<p>도입</p><h2>첫 &amp; 번째</h2><p>본문</p><h3><strong>세부</strong> 기준</h3>',
    );

    expect(document.tableOfContents).toEqual([
      { id: 'column-section-1', label: '첫 & 번째', level: 2 },
      { id: 'column-section-2', label: '세부 기준', level: 3 },
    ]);
    expect(document.bodyHtml).toContain('<h2 id="column-section-1">첫 &amp; 번째</h2>');
    expect(document.bodyHtml).toContain('<h3 id="column-section-2"><strong>세부</strong> 기준</h3>');
  });

  test('안전하고 고유한 기존 id는 보존하고 중복 id만 교체한다', () => {
    const document = buildColumnDocument(
      '<h2 id="diagnosis">진단</h2><h3 id="diagnosis">세부 진단</h3><h2 id="한글-기준">한글 기준</h2>',
    );

    expect(document.tableOfContents.map(({ id }) => id)).toEqual([
      'diagnosis',
      'column-section-2',
      '한글-기준',
    ]);
    expect(document.bodyHtml).toContain('<h2 id="diagnosis">진단</h2>');
    expect(document.bodyHtml).toContain('<h3 id="column-section-2">세부 진단</h3>');
  });

  test('제목이 없거나 빈 제목뿐이면 본문을 바꾸지 않는다', () => {
    for (const bodyHtml of ['<p>본문만 있습니다.</p>', '<h2><span></span></h2>']) {
      expect(buildColumnDocument(bodyHtml)).toEqual({
        bodyHtml,
        tableOfContents: [],
      });
    }
  });

  test('편집기에서 큰 굵은 글씨로 작성한 소제목도 본문 서식을 유지하며 목차에 넣는다', () => {
    const document = buildColumnDocument(
      '<p><strong><span style="font-size:32px">첫 소제목</span></strong></p>'
      + '<p>본문입니다.</p><h2>제목 태그</h2>'
      + '<p style="font-size:24px"><b>세부 <span>소제목</span></b></p>',
    );

    expect(document.tableOfContents.map(({ label, level }) => ({ label, level }))).toEqual([
      { label: '첫 소제목', level: 2 },
      { label: '제목 태그', level: 2 },
      { label: '세부 소제목', level: 3 },
    ]);
    expect(document.bodyHtml).toContain('id="column-section-1"');
    expect(document.bodyHtml).toContain('data-column-heading="2"');
    expect(document.bodyHtml).toContain('<strong><span style="font-size:32px">첫 소제목</span></strong></p>');
  });

  test('일반 강조 문장과 일부 글자만 크거나 굵은 문단은 목차로 오인하지 않는다', () => {
    const bodyHtml = '<p><strong>중요한 본문 문장</strong></p>'
      + '<p><strong><span style="font-size:32px">큰 글씨</span></strong> 뒤에 이어지는 본문</p>'
      + '<p><span style="font-size:32px">굵지 않은 글씨</span></p>'
      + '<p><a href="/column"><strong><span style="font-size:32px">관련 글 링크</span></strong></a></p>';

    expect(buildColumnDocument(bodyHtml)).toEqual({ bodyHtml, tableOfContents: [] });
  });

  test('범위를 벗어난 숫자 엔티티가 들어와도 목차 생성이 중단되지 않는다', () => {
    const document = buildColumnDocument('<h2>안전한 제목 &#99999999;</h2>');

    expect(document.tableOfContents[0]?.label).toBe('안전한 제목');
  });

  test('이관 HTML 보존 모드는 원문을 바꾸지 않고 목차 데이터만 만든다', () => {
    const bodyHtml = '<h2 class="legacy-title"><b>원문 제목</b></h2><p>본문</p>';

    expect(buildColumnDocument(bodyHtml, 'source-preserved')).toEqual({
      bodyHtml,
      tableOfContents: [
        { id: 'column-section-1', label: '원문 제목', level: 2 },
      ],
    });
  });
});
