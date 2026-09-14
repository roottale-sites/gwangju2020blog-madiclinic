import { clinic } from '../../data/clinic';
import { mainSiteOrigin } from '../../data/nav';

/**
 * 본 사이트 푸터(`#bottom`) 재현.
 *
 * 마크업은 본 사이트 홈의 `#bottom`을 그대로 옮기고 문구는 `data/clinic.ts`에서
 * 읽는다. 스타일은 `src/styles/madi/patterns.css`(baseStyle.css L391-453).
 *
 * 본 사이트의 `.nabyArea`(제작사 크레딧 띠·관리자 로그인)와 `.BtGoTop`은 이
 * 사이트의 것이 아니라 옮기지 않았다. 메뉴 띠는 본 사이트 항목 5개를 절대주소로
 * 둔다 - 블로그 세 섹션은 헤더 GNB `건강정보`가 모든 페이지에서 링크한다.
 */
const footerMenu = [
  { label: '원장 소개', href: `${mainSiteOrigin}/doctor/doctor01.html` },
  { label: '병원 소개', href: `${mainSiteOrigin}/about/about01.html` },
  { label: '진료 안내', href: `${mainSiteOrigin}/clinic/clinic01.html` },
  { label: '비수술 중점치료', href: `${mainSiteOrigin}/special/special01.html` },
  { label: '비급여 항목', href: `${mainSiteOrigin}/clinic/clinic02.html` },
] as const;

export default function MadiFooter() {
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
          <img src="/madi/img/bottomHI_gwangju2020_20240826.png" alt={clinic.logoAlt} />
        </div>

        <div className="copyrightArea clearFix">
          <ul className="companyInfo clearFix">
            <li>
              <ul>
                <li>사업자등록번호 : {clinic.businessNumber}</li>
                <li>
                  {clinic.representativeTitle} : {clinic.representative}
                </li>
              </ul>
            </li>
            <li>
              <ul>
                <li>{clinic.address.line}</li>
              </ul>
            </li>
            <li>
              <ul>
                <li>TEL / {clinic.phoneDisplay}</li>
                <li>FAX / {clinic.faxDisplay}</li>
                <li>EMAIL / {clinic.email}</li>
              </ul>
            </li>
          </ul>
          <p className="copyright">{clinic.copyright}</p>
        </div>
      </div>
    </div>
  );
}
