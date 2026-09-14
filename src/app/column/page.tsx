import MadiPageFrame from '../../components/madi/MadiPageFrame';

export const metadata = { title: '칼럼' };

/** 5단계에서 headnerve `ColumnArchive` 본문으로 교체한다(PLAN.md §6-5). */
export default function ColumnPage() {
  return (
    <MadiPageFrame
      pathname="/column"
      title="칼럼"
      banner="01"
      crumbs={[{ name: '건강정보', href: '/column' }, { name: '칼럼', href: '/column' }]}
    >
      <div className="cBox clearFix">
        <h4>칼럼</h4>
        <p>준비 중입니다.</p>
      </div>
    </MadiPageFrame>
  );
}
