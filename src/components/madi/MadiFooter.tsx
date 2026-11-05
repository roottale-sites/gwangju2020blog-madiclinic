import { bindGroup, contentAttributes as edit, verificationAttributes as verify, present, type SiteContent } from '../../features/site-content/bindings';
import { commonDefaults } from '../../features/site-content/defaults';
import Text from '../../features/site-content/EditableText';
import { clinic as original } from '../../data/clinic';
import { mainSiteOrigin } from '../../data/nav';

/**
 * 본 사이트 푸터(`#bottom`) 재현.
 *
 * 마크업은 본 사이트 홈의 `#bottom`을 그대로 옮기고 문구는 `data/clinic.ts`에서
 * 읽는다. 스타일은 `src/styles/madi/patterns.css`(baseStyle.css L391-453).
 *
 * 본 사이트의 `.nabyArea`(제작사 크레딧 띠·관리자 로그인)와 `.BtGoTop`은 이
 * 사이트의 것이 아니라 옮기지 않았다. 메뉴 띠는 본 사이트 항목 5개를 절대주소로
 * 둔다 - 블로그 세 섹션은 헤더 GNB `커뮤니티`가 모든 페이지에서 링크한다.
 */
const footerMenu = [
  { label: '원장 소개', href: `${mainSiteOrigin}/doctor/doctor01.html` },
  { label: '병원 소개', href: `${mainSiteOrigin}/about/about01.html` },
  { label: '진료 안내', href: `${mainSiteOrigin}/clinic/clinic01.html` },
  { label: '비수술 중점치료', href: `${mainSiteOrigin}/special/special01.html` },
  { label: '비급여 항목', href: `${mainSiteOrigin}/clinic/clinic02.html` },
] as const;

export default function MadiFooter({ content }: { content?: SiteContent } = {}) {
  const { clinic, footer: labels } = bindGroup(content, 'clinic-common', 'shared', commonDefaults);
  return (
    <div id="bottom" className="clearFix">
      <ul className="bottomMenu clearFix">
        {footerMenu.map((item) => (
          <li key={item.label}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>

      <div className="bottomArea clearFix">
        <div className="bottomCI clearFix">
          <img src="/madi/img/bottomHI_gwangju2020_20240826.png" alt={original.logoAlt} />
        </div>

        <div className="copyrightArea clearFix">
          <ul className="companyInfo clearFix">
            <li>
              <ul>
                {present(clinic.businessNumber) && <li><Text owner={labels} field="business">{labels.business}</Text><Text owner={clinic} field="businessNumber">{clinic.businessNumber}</Text></li>}
                {(present(clinic.representative) || present(clinic.representativeTitle)) && <li>
                  <Text owner={clinic} field="representativeTitle">{clinic.representativeTitle}</Text><Text owner={labels} field="representative">{labels.representative}</Text><Text owner={clinic} field="representative">{clinic.representative}</Text>
                </li>}
              </ul>
            </li>
            <li>
              <ul>
                {present(clinic.address.line) && <li {...edit(clinic.address, 'line')} {...verify(clinic.address, 'line')}>{clinic.address.line}</li>}
              </ul>
            </li>
            <li>
              <ul>
                {present(clinic.phoneDisplay) && <li><Text owner={labels} field="phone">{labels.phone}</Text><Text owner={clinic} field="phoneDisplay">{clinic.phoneDisplay}</Text></li>}
                {present(clinic.faxDisplay) && <li><Text owner={labels} field="fax">{labels.fax}</Text><Text owner={clinic} field="faxDisplay">{clinic.faxDisplay}</Text></li>}
                {present(clinic.email) && <li><Text owner={labels} field="email">{labels.email}</Text><Text owner={clinic} field="email">{clinic.email}</Text></li>}
              </ul>
            </li>
          </ul>
          {present(clinic.copyright) && <p className="copyright" {...edit(clinic, 'copyright')} {...verify(clinic, 'copyright')}>{clinic.copyright}</p>}
        </div>
      </div>
    </div>
  );
}
