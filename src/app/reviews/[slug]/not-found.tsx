import '../../../styles/site/reviews.css';
import MadiPageFrame from '../../../components/madi/MadiPageFrame';
import { reviewsIndexMetadata } from '../../../features/reviews/review-content';
import { reviewsBreadcrumb } from '../page';

/** 공개가 끝났거나 주소가 바뀐 후기. 골격은 발행 화면과 같다. */
export default function ReviewNotFound() {
  return (
    <MadiPageFrame
      pathname="/reviews"
      title={reviewsIndexMetadata.label}
      banner="02"
      crumbs={reviewsBreadcrumb}
    >
      <div className="cBox review-detail-page clearFix">
        <section className="reviews-state reviews-state--page" aria-labelledby="review-state-title">
          <h1 id="review-state-title">후기를 찾을 수 없습니다</h1>
          <p>주소가 바뀌었거나 공개가 종료된 후기입니다.</p>
          <a className="reviews-state__link" href="/reviews">
            후기 목록으로
          </a>
        </section>
      </div>
    </MadiPageFrame>
  );
}
