import { clinic } from '../../data/clinic';

/** 세 상세 화면의 진료 안내. 병원 정보와 클릭 식별자는 한 곳에서 유지한다. */
export default function ClinicGuide() {
  return (
    <aside className="clinic-guide" aria-label="진료 안내" data-analytics-placement="clinic-guide">
      <div className="clinic-guide__details">
        <div className="clinic-guide__intro">
          <span className="clinic-guide__label">진료 안내</span>
          <h2>{clinic.name}</h2>
          <p>{clinic.address.line}</p>
        </div>
        <div>
          <dl className="clinic-guide__hours">
            {clinic.hours.map((hour) => (
              <div key={hour.label}>
                <dt>{hour.label}</dt>
                <dd>{hour.value}</dd>
              </div>
            ))}
          </dl>
          <p className="clinic-guide__holiday">{clinic.holidayNote}</p>
        </div>
      </div>
      <p className="clinic-guide__note">{clinic.bookingNote}</p>
      <div className="clinic-guide__actions">
        <a className="clinic-guide__booking" href={clinic.social.naverBooking}
          target="_blank" rel="noopener noreferrer" data-analytics-id="naver-booking">
          <img src="/madi/img/iconReservationNaver.png" width="22" height="24" alt="" />
          <span>네이버 예약 바로가기</span>
        </a>
        <a className="clinic-guide__phone" href={`tel:${clinic.phoneTel}`}
          data-analytics-id="phone-call">
          <img src="/madi/img/mIconLinkPhone.png" width="22" height="24" alt="" />
          <span>지금 바로 전화걸기</span>
        </a>
      </div>
    </aside>
  );
}
