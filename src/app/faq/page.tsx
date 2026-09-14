import MadiPageFrame from '../../components/madi/MadiPageFrame';

export const metadata = { title: '자주 묻는 질문' };

/** 7단계에서 headnerve `FaqHomePage` 본문으로 교체한다(PLAN.md §6-7). */
export default function FaqPage() {
  return (
    <MadiPageFrame
      pathname="/faq"
      title="자주 묻는 질문"
      banner="03"
      crumbs={[{ name: '커뮤니티', href: '/column' }, { name: '자주 묻는 질문', href: '/faq' }]}
    >
      <div className="cBox clearFix">
        <h4>자주 묻는 질문</h4>
        <p>준비 중입니다.</p>
      </div>
    </MadiPageFrame>
  );
}
