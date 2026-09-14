'use client';

/**
 * 본 사이트의 접근성 건너뛰기 링크(`#skipBind`) + 실제로 포커스를 옮기는 처리.
 *
 * 마크업·스타일은 본 사이트 그대로다(baseStyle.css L157-162,
 * `src/styles/madi/header.css`에 옮겨져 있다). 높이 0으로 숨어 있다가
 * `:focus`에서 40px 띠로 나타난다. 원본은 `#header` 바로 앞에 있고, 여기서도
 * `SiteLayout`이 body 최상단에 둬서 DOM 순서가 같다.
 *
 * 포커스 처리만 headnerve `SkipLink`에서 가져왔다. `href="#main"`만으로는
 * 스크롤만 되고 `<main>`은 포커스를 받을 수 없어 `document.activeElement`가
 * body에 남는다. 다음 Tab이 헤더에서 다시 시작하는, 건너뛰기 링크가 없애려던
 * 바로 그 고리가 생긴다. 활성화 시점에 `tabindex="-1"`을 줘서 스크립트로만
 * 포커스 가능하게 만들고(Tab 순서에는 넣지 않는다) 포커스를 옮긴다.
 *
 * 기본 해시 이동은 그대로 둬서 URL·스크롤·히스토리 동작을 건드리지 않는다.
 */
export default function SkipLink() {
  return (
    <ul id="skipBind">
      <li>
        {' '}
        <a href="#gnb">주메뉴 바로가기</a>
      </li>
      <li>
        <a
          href="#main"
          onClick={() => {
            const main = document.getElementById('main');
            if (!main) return;
            main.tabIndex = -1;
            main.focus();
          }}
        >
          본문으로 바로가기
        </a>
      </li>
    </ul>
  );
}
