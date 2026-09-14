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
