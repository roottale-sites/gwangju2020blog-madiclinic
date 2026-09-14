import { describe, expect, test } from 'vitest';

import { isNonCanonicalHost } from './preview-noindex';

describe('임시 배포 도메인 색인 제외 정책', () => {
  test('운영 도메인과 www를 제외한 배포 호스트는 임시 주소로 식별한다', () => {
    expect(isNonCanonicalHost('preview.example.test')).toBe(true);
    expect(isNonCanonicalHost('PREVIEW.EXAMPLE.TEST')).toBe(true);
    expect(isNonCanonicalHost('gwangju2020blog.madiclinic.co.kr')).toBe(false);
    expect(isNonCanonicalHost('www.gwangju2020blog.madiclinic.co.kr')).toBe(false);
  });
});
