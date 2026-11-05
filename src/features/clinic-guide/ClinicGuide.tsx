import { clinic as original } from '../../data/clinic';
import { bindGroup, contentAttributes as edit, present, safeContentHref, sectionVisible, type SiteContent } from '../site-content/bindings';
import { guideDefaults, type FooterModelKey } from '../site-content/defaults';
import Text from '../site-content/EditableText';
import { phoneFromDisplay } from '../site-content/phone';

/** 같은 카드 구조에서 각 문서의 독립된 값을 표시한다. */
export default function ClinicGuide({ content, modelKey = 'column-footer' }: { content?: SiteContent; modelKey?: FooterModelKey } = {}) {
  const { guide: { clinic, labels } } = bindGroup(content, modelKey, 'footer', { guide: guideDefaults() });
  if (!sectionVisible(content, modelKey, 'guide')) return null;
  const phoneHref = phoneFromDisplay(clinic.phoneDisplay)?.href;
  const actions = [
    { key: 'question', href: clinic.social.cafe, className: 'question', analytics: 'cafe-question' },
    { key: 'booking', href: clinic.social.naverBooking, className: 'booking', analytics: 'naver-booking' },
    { key: 'blog', href: clinic.social.blog, className: 'blog', analytics: 'naver-blog' },
    { key: 'talk', href: clinic.social.naverTalk, className: 'talk', analytics: 'naver-talk', aria: '네이버톡톡으로 상담하기' },
    { key: 'kakao', href: clinic.social.kakao, className: 'kakao', analytics: 'kakao-chat', aria: '카카오톡으로 상담하기' },
  ] as const;
  return (
    <aside className="clinic-guide" aria-label="진료 안내" data-analytics-placement="clinic-guide">
      <div className="clinic-guide__details">
        <div className="clinic-guide__intro">
          {present(clinic.guideName) && <h2 {...edit(clinic, 'guideName')}>{clinic.guideName}</h2>}
          {present(clinic.address.detail) && <p {...edit(clinic.address, 'detail')}>{clinic.address.detail}</p>}
          {present(clinic.phoneDisplay) && phoneHref && <p><Text owner={labels} field="phone">{labels.phone}</Text><a href={phoneHref} data-analytics-id="phone-call" {...edit(clinic, 'phoneDisplay')}>{clinic.phoneDisplay}</a></p>}
        </div>
        <figure className="clinic-guide__doctor">
          <img src={original.doctorPortrait.src} width={original.doctorPortrait.width}
            height={original.doctorPortrait.height} alt={clinic.doctorPortrait.alt}
            loading="lazy" decoding="async" {...edit(clinic.doctorPortrait, 'alt')} />
          {(present(clinic.representative) || present(clinic.representativeTitle)) && <figcaption><Text owner={clinic} field="representative">{clinic.representative}</Text>{' '}<Text owner={clinic} field="representativeTitle">{clinic.representativeTitle}</Text></figcaption>}
        </figure>
        <div className="clinic-guide__hours-section">
          {present(labels.hours) && <h3 {...edit(labels, 'hours')}>{labels.hours}</h3>}
          <dl className="clinic-guide__hours">
            {clinic.hours.map((hour, index) => present(hour.label) && present(hour.value) && (
              <div key={index}><dt {...edit(hour, 'label')}>{hour.label}</dt><dd {...edit(hour, 'value')}>{hour.value}</dd></div>
            ))}
          </dl>
          {present(clinic.holidayNote) && <p className="clinic-guide__holiday" {...edit(clinic, 'holidayNote')}>{clinic.holidayNote}</p>}
          {present(clinic.lunchNote) && <p className="clinic-guide__lunch" {...edit(clinic, 'lunchNote')}>{clinic.lunchNote}</p>}
        </div>
        <dl className="clinic-guide__directions">
          {clinic.directions.map((direction, index) => present(direction.label) && present(direction.text) && (
            <div key={index}><dt {...edit(direction, 'label')}>{direction.label}</dt><dd {...edit(direction, 'text')}>{direction.text}</dd></div>
          ))}
        </dl>
      </div>
      <nav className="clinic-guide__actions" aria-label="병원 외부 채널">
        {actions.map(action => present(labels[action.key]) && safeContentHref(action.href) && <a key={action.key}
          className={`clinic-guide__${action.className}`} href={safeContentHref(action.href)}
          target="_blank" rel="noopener noreferrer" data-analytics-id={action.analytics}
          {...(action.key === 'question' ? { 'data-analytics-cta': 'true' } : {})}
          {...('aria' in action ? { 'aria-label': action.aria } : {})}
          {...edit(labels, action.key)}>{labels[action.key]}</a>)}
      </nav>
    </aside>
  );
}
