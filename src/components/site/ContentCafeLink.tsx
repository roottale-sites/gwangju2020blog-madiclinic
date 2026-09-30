import { clinic } from '../../data/clinic';

/** 상세 글에서 환자 커뮤니티의 질문 작성으로 연결한다. */
export default function ContentCafeLink() {
  return (
    <a className="content-cafe-link" href={clinic.social.cafe}
      target="_blank" rel="noopener noreferrer" data-analytics-id="cafe-question"
      data-analytics-placement="article-header">
      <span className="content-cafe-link__icon" aria-hidden="true">N</span>
      <span className="content-cafe-link__copy">
        <span className="content-cafe-link__label">네이버 카페</span>
        <span>카페에 궁금한 점 질문하기</span>
      </span>
      <span className="content-cafe-link__arrow" aria-hidden="true">↗</span>
    </a>
  );
}
