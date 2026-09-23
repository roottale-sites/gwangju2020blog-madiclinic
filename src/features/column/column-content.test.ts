import { describe, expect, test } from 'vitest';

import {
  COLUMN_DESCRIPTION_MAX_LENGTH,
  columnIndexMetadata,
  columnMedicalDisclaimer,
  columnSeoTitle,
  formatColumnDate,
} from './column-content';

describe('블로그 문구', () => {
  test('화면 라벨은 GNB 하위 항목과 같은 "블로그"다', () => {
    // 헤더 GNB(`data/nav.ts`)·서브 배너·h1·브레드크럼이 같은 이름을 써야 한다.
    expect(columnIndexMetadata.label).toBe('블로그');
  });

  test('목록 title·설명은 마디클리닉 문구이며 다른 병원 이름이 남아 있지 않다', () => {
    expect(columnIndexMetadata.title).toContain('광주 남구 마디클리닉');
    expect(columnIndexMetadata.description).toContain('이경무');
    for (const value of [columnIndexMetadata.title, columnIndexMetadata.description, columnMedicalDisclaimer]) {
      expect(value).not.toContain('한의원');
    }
  });

  test('상세 title은 레이아웃 template을 거치지 않는 절대값이다', () => {
    expect(columnSeoTitle({ title: '무릎 통증' })).toBe('무릎 통증 | 광주 남구 마디클리닉 블로그');
  });

  test('메타 디스크립션 상한은 한 곳에서만 정한다', () => {
    expect(COLUMN_DESCRIPTION_MAX_LENGTH).toBe(160);
  });
});

describe('발행일 표시', () => {
  test('서울 시간대 기준 한국어 날짜로 적는다', () => {
    expect(formatColumnDate('2026-09-15T00:30:00+09:00')).toBe('2026년 9월 15일');
  });

  test('읽을 수 없는 값은 빈 문자열이라 빈 칸만 남는다', () => {
    expect(formatColumnDate('언제인지-모름')).toBe('');
  });
});
