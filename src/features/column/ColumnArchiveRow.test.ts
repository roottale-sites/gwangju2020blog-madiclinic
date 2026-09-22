import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { mainSiteOrigin } from '../../data/nav';
import ColumnArchiveRow from './ColumnArchiveRow';
import type { ColumnArchiveEntry } from './column-model';

/**
 * headnerve `ColumnArchiveRow.test.ts`를 이 저장소 픽스처로 다시 쓴 것이다.
 * 이관 글의 발췌문·표시 메타데이터 보정 계약만 빠졌고, 도판·주소·지은이 링크
 * 계약은 그대로다.
 */
function entry(overrides: Partial<ColumnArchiveEntry> = {}): ColumnArchiveEntry {
  return {
    slug: '무릎-통증',
    title: '무릎 통증의 원인',
    description: '무릎 통증의 흔한 원인을 살펴봅니다.',
    publishedAt: '2026-09-15T15:48:00+09:00',
    category: { slug: 'knee', name: '무릎', path: '/column/knee' },
    ...overrides,
  };
}

function renderRow(row: ColumnArchiveEntry): string {
  return renderToStaticMarkup(
    createElement('ul', null, createElement(ColumnArchiveRow, { entry: row })),
  );
}

describe('블로그 목록 행', () => {
  test('대표 이미지는 중복 낭독하지 않는 장식 이미지로 표시한다', () => {
    const html = renderRow(entry({ featuredImageUrl: 'https://cdn.example.com/cover.webp' }));

    expect(html).toContain('class="column-card__image"');
    expect(html).toContain('src="https://cdn.example.com/cover.webp"');
    expect(html).toContain('alt=""');
    expect(html).toContain('href="/column/knee/%EB%AC%B4%EB%A6%8E-%ED%86%B5%EC%A6%9D"');
  });

  test('플랫폼 원장 경로(path)가 있으면 조립하지 않고 그대로 링크한다 (ADR-0105)', () => {
    const html = renderRow(entry({ path: '/column/spine/knee-pain' }));

    expect(html).toContain('href="/column/spine/knee-pain"');
    expect(html).not.toContain('href="/column/knee/');
  });

  test('대표 이미지가 없으면 병원 로고로 목록 리듬을 지킨다', () => {
    const html = renderRow(entry());

    expect(html).toContain('class="column-card__brand-logo"');
    expect(html).toContain('src="/madi/img/hi_gwangju2020_20240826.png"');
    expect(html).toContain('alt=""');
  });

  test('요약은 메타 디스크립션을 그대로 보여 준다', () => {
    expect(renderRow(entry())).toContain('무릎 통증의 흔한 원인을 살펴봅니다.');
  });

  test('카드 분류를 누르면 해당 카테고리 목록으로 이동한다', () => {
    expect(renderRow(entry())).toContain('class="column-card__category" href="/column/knee"');
  });

  test('발행일은 서울 시간대 기준으로 적고 기계용 값도 남긴다', () => {
    const html = renderRow(entry());

    expect(html).toContain('dateTime="2026-09-15T15:48:00+09:00"');
    expect(html).toContain('2026년 9월 15일');
  });

  test('지은이를 누르면 본 사이트 원장 프로필로 가고, 제목 링크와 겹치지 않는다', () => {
    const html = renderRow(entry());

    expect(html).toContain(`href="${mainSiteOrigin}/doctor/doctor01.html"`);
    expect(html).toContain('이경무 원장');
    // 링크 안에 링크를 넣으면 브라우저가 DOM을 쪼갠다. 행 전체 링크는 제목 하나로만 편다.
    expect(html).toContain('class="column-card__title-link"');
    expect(html).not.toContain('class="column-card__link" href=');
  });
});

 test('복사 메타데이터가 있어도 지정 글쓴이를 표시한다', () => {
  const html = renderRow(entry({ copiedFrom: { name: 'headnerve', url: 'https://headnerve.com/column/headache/example' } }));
  expect(html).not.toContain('원문: headnerve');
  expect(html).toContain(`href="${mainSiteOrigin}/doctor/doctor01.html"`);
  expect(html).toContain('이경무 원장');
});
