/**
 * 본 사이트 서브 배너(`#bnSubArea .subVisualArea`) 재현.
 *
 * 마크업·치수 정본은 `docs/assets/madiclinic-header/sub-visual.css`
 * (= subStyle.css L4-42), 스타일은 `src/styles/madi/patterns.css`.
 *
 * `padding-top`이 고정 헤더 높이(140px, ≤980px는 120px)와 같아서 이 배너가
 * 본문이 헤더에 가리지 않게 막는 유일한 장치다. 높이를 줄이려면 헤더 높이도
 * 같이 봐야 한다.
 */

/** 배너 배경. PLAN.md §2.2: 칼럼 01, 후기 02, FAQ 03. */
export type MadiBannerNo = '01' | '02' | '03';

export default function MadiSubVisual({
  title,
  banner,
}: Readonly<{ title: string; banner: MadiBannerNo }>) {
  return (
    <div id="bnSubArea">
      <div className={`subVisualArea sbnNo${banner} clearFix`}>
        <div className="sbn">
          <h2>{title}</h2>
        </div>
      </div>
    </div>
  );
}
