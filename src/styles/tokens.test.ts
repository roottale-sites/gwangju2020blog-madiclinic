import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `tokens.css`가 `docs/DESIGN.md` §7과 같은지 검사한다.
 *
 * 토큰 값은 본 사이트 CSS 실측이라 코드에서 임의로 고칠 수 없다. 설계 문서와
 * 구현이 갈라지는 것을 여기서 막는다(PLAN.md §5.2: headnerve의 계약 테스트
 * 13개를 이 검사 하나로 대체한다). 값을 바꿀 일이 생기면 DESIGN.md §7을 먼저
 * 고치고 이 테스트를 다시 돌린다.
 */
function normalize(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\s+/g, ' ');
}

/** DESIGN.md §7의 ```css 블록. */
function designTokenBlock(): string {
  const doc = readFileSync('docs/DESIGN.md', 'utf8');
  const heading = doc.indexOf('## 7. `src/styles/tokens.css` 초안');
  expect(heading).toBeGreaterThan(-1);
  const open = doc.indexOf('```css', heading);
  const close = doc.indexOf('```', open + 6);
  expect(open).toBeGreaterThan(-1);
  expect(close).toBeGreaterThan(open);
  return doc.slice(open + 6, close);
}

describe('디자인 토큰 계약', () => {
  it('tokens.css의 선언은 DESIGN.md §7과 같다', () => {
    expect(normalize(readFileSync('src/styles/tokens.css', 'utf8'))).toBe(
      normalize(designTokenBlock()),
    );
  });

  it('헤더 CSS는 토큰을 쓰지 않는다 - 1px 재현 대상이라 간접 참조를 두지 않는다', () => {
    expect(readFileSync('src/styles/madi/header.css', 'utf8')).not.toMatch(/var\(--madi-/);
  });
});
