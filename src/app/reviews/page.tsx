import MadiPageFrame from '../../components/madi/MadiPageFrame';

export const metadata = { title: '치료후기' };

/** 6단계에서 headnerve `reviews` 본문으로 교체한다(PLAN.md §6-6). */
export default function ReviewsPage() {
  return (
    <MadiPageFrame
      pathname="/reviews"
      title="치료후기"
      banner="02"
      crumbs={[{ name: '건강정보', href: '/column' }, { name: '치료후기', href: '/reviews' }]}
    >
      <div className="cBox clearFix">
        <h4>치료후기</h4>
        <p>준비 중입니다.</p>
      </div>
    </MadiPageFrame>
  );
}
