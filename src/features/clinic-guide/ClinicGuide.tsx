import { clinic } from '../../data/clinic';

/**
 * 칼럼·후기 상세 하단의 "진료 안내" 박스.
 *
 * headnerve는 이 자리에 Tiptap JSON 본문을 렌더하는 `ClinicGuide`(`.post-pattern`)를
 * 뒀다. 이 저장소는 본 사이트 안내 박스 문법(`.commonBox`, DESIGN.md §5)을 쓰고
 * 내용은 `src/data/clinic.ts`에서 읽는다 — 전화·주소·진료시간이 두 곳에 적히면
 * 한쪽만 고쳐질 수 있다.
 *
 * `post-pattern.css`가 본문과의 간격, 안내 내용, 병원 원본 예약·전화 버튼을
 * 함께 관리한다.
 */
export default function ClinicGuide() {
  return (
    <aside className="commonBox clinic-guide" aria-label="진료 안내" data-analytics-placement="clinic-guide">
      <div className="commonTitle" aria-hidden="true" />
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
        </div>
      </div>
      <div className="post-pattern__actions">
        <a className="post-pattern__booking" href={clinic.social.naverBooking}
          target="_blank" rel="noopener noreferrer" data-analytics-id="naver-booking">
          네이버 예약 바로가기
        </a>
        <a className="post-pattern__phone" href={`tel:${clinic.phoneTel}`}
          data-analytics-id="phone-call">
          지금 바로 전화걸기
        </a>
      </div>
    </aside>
  );
}
