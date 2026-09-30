import { clinic } from '../../data/clinic';

/** 상세 글에서 환자 커뮤니티의 질문 작성으로 연결한다. */
export default function ContentCafeLink() {
  return (
    <a className="content-cafe-link" href={clinic.social.cafe}
      target="_blank" rel="noopener noreferrer" data-analytics-id="cafe-question"
      data-analytics-placement="article-header">
      <span>카페에 궁금한 점 질문하기</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
