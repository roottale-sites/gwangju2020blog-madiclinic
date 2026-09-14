import { clinic } from '../../data/clinic';

/**
 * 칼럼·후기 상세 하단의 "진료 안내" 박스.
 *
 * headnerve는 이 자리에 Tiptap JSON 본문을 렌더하는 `ClinicGuide`(`.post-pattern`)를
 * 뒀다. 이 저장소는 본 사이트 안내 박스 문법(`.commonBox`, DESIGN.md §5)을 쓰고
 * 내용은 `src/data/clinic.ts`에서 읽는다 — 전화·주소·진료시간이 두 곳에 적히면
 * 한쪽만 고쳐질 수 있다.
 *
 * 틀(`.commonBox`)은 `styles/madi/patterns.css`의 원본 값이고, 안쪽 본문·버튼은
 * `styles/site/post-pattern.css`(headnerve `post-pattern.css`를 마디 토큰으로 옮긴
 * 것)가 스타일한다.
 */
export default function ClinicGuide() {
  return (
    <aside className="commonBox" aria-label="진료 안내">
      <div className="commonTitle" />
      <div className="commonText">
        <div className="post-pattern">
          <h2>{clinic.name}</h2>
          <p>{clinic.address.line}</p>
          <dl className="post-pattern__hours">
            {clinic.hours.map((hour) => (
              <div key={hour.label}>
                <dt>{hour.label}</dt>
                <dd>{hour.value}</dd>
              </div>
            ))}
          </dl>
          <p className="post-pattern__note">
            ※ {clinic.holidayNote} {clinic.bookingNote}
          </p>
          <p className="post-pattern__actions">
            <a href={`tel:${clinic.phoneTel}`}>전화 {clinic.phoneDisplay}</a>
            <a href={clinic.social.naverBooking} target="_blank" rel="noopener noreferrer">
              네이버 예약하기
            </a>
            <a href={clinic.social.kakao} target="_blank" rel="noopener noreferrer">
              카카오 채널 문의
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
