import { clinic } from '../../data/clinic';

/** 블로그·후기·FAQ가 함께 쓰는 병원 안내와 문의·예약 동작. */
export default function ClinicGuide() {
  return (
    <aside className="clinic-guide" aria-label="진료 안내" data-analytics-placement="clinic-guide">
      <div className="clinic-guide__details">
        <div className="clinic-guide__intro">
          <h2>{clinic.guideName}</h2>
          <p>{clinic.address.detail}</p>
          <p>대표전화 : <a href={`tel:${clinic.phoneTel}`} data-analytics-id="phone-call">{clinic.phoneDisplay}</a></p>
        </div>
        <figure className="clinic-guide__doctor">
          <img src={clinic.doctorPortrait.src} width={clinic.doctorPortrait.width}
            height={clinic.doctorPortrait.height} alt={clinic.doctorPortrait.alt}
            loading="lazy" decoding="async" />
          <figcaption>{clinic.representative} {clinic.representativeTitle}</figcaption>
        </figure>
        <div className="clinic-guide__hours-section">
          <h3>진료시간</h3>
          <dl className="clinic-guide__hours">
            {clinic.hours.map((hour) => (
              <div key={hour.label}>
                <dt>{hour.label}</dt>
                <dd>{hour.value}</dd>
              </div>
            ))}
          </dl>
          <p className="clinic-guide__holiday">{clinic.holidayNote}</p>
          <p className="clinic-guide__lunch">{clinic.lunchNote}</p>
        </div>
        <dl className="clinic-guide__directions">
          {clinic.directions.map((direction) => (
            <div key={direction.label}>
              <dt>{direction.label}</dt>
              <dd>{direction.text}</dd>
            </div>
          ))}
        </dl>
      </div>
      <nav className="clinic-guide__actions" aria-label="병원 외부 채널">
        <a className="clinic-guide__question" href={clinic.social.cafe}
          target="_blank" rel="noopener noreferrer" data-analytics-id="cafe-question">질문하기</a>
        <a className="clinic-guide__booking" href={clinic.social.naverBooking}
          target="_blank" rel="noopener noreferrer" data-analytics-id="naver-booking">예약하기</a>
        <a className="clinic-guide__blog" href={clinic.social.blog} target="_blank" rel="noopener noreferrer"
          data-analytics-id="naver-blog">블로그</a>
        <a className="clinic-guide__talk" href={clinic.social.naverTalk} target="_blank" rel="noopener noreferrer"
          data-analytics-id="naver-talk" aria-label="네이버톡톡으로 상담하기">네이버톡톡</a>
        <a className="clinic-guide__kakao" href={clinic.social.kakao} target="_blank" rel="noopener noreferrer"
          data-analytics-id="kakao-chat" aria-label="카카오톡으로 상담하기">카카오톡</a>
      </nav>
    </aside>
  );
}
