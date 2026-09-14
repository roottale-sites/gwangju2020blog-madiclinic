import { describe, expect, test } from 'vitest';

import { gnb } from '../../data/nav';
import {
  FAQ_DESCRIPTION_MAX_LENGTH,
  faqDescription,
  faqIndexMetadata,
  faqMedicalNote,
  faqNotices,
  faqSectionFallbackDescription,
  faqSectionPageTitle,
  faqTitleWithSuffix,
  formatFaqAnswerDate,
} from './faq-content';

describe('자주 묻는 질문 문구', () => {
  test('화면 라벨은 GNB 하위 항목과 같은 이름이다', () => {
    const child = gnb
      .flatMap((group) => group.children)
      .find((item) => item.href === '/faq');
    expect(child?.label).toBe(faqIndexMetadata.label);
  });

  test('목록 title·설명은 마디클리닉 문구이며 다른 병원 이름이 남아 있지 않다', () => {
    expect(faqIndexMetadata.title).toContain('광주 남구 마디클리닉');
    expect(faqIndexMetadata.description).toContain('이경무');
    for (const value of [
      faqIndexMetadata.title,
      faqIndexMetadata.description,
      faqMedicalNote.body,
      ...Object.values(faqNotices),
    ]) {
      expect(value).not.toContain('한의원');
    }
  });

  test('하위 단계 title은 레이아웃 template을 거치지 않는 절대값이다', () => {
    expect(faqTitleWithSuffix('목 통증 자주 묻는 질문'))
      .toBe('목 통증 자주 묻는 질문 | 자주 묻는 질문 | 광주 남구 마디클리닉');
  });

  test('분류 문구 서식만 코드에 두고 분류 이름은 CMS에서 받는다', () => {
    expect(faqSectionPageTitle('목 통증')).toBe('목 통증 자주 묻는 질문');
    expect(faqSectionFallbackDescription('목 통증')).toContain('목 통증');
  });

  test('메타 디스크립션은 한 상한에서만 잘린다', () => {
    expect(FAQ_DESCRIPTION_MAX_LENGTH).toBe(160);
    expect(faqDescription('  두 \n 줄  ')).toBe('두 줄');
    expect(faqDescription('')).toBe(faqIndexMetadata.description);
    expect(faqDescription('가'.repeat(200))).toHaveLength(FAQ_DESCRIPTION_MAX_LENGTH);
  });

  test('답변일은 본 사이트 날짜 표기(YYYY. M. D.)를 쓴다', () => {
    expect(formatFaqAnswerDate('2026-09-15T00:00:00.000Z')).toBe('답변일 2026. 09. 15.');
  });
});
