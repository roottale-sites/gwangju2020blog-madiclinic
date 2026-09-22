import MadiHeaderBehavior from './MadiHeaderBehavior';
import { branchTabs, gnb, isBlogPath, isNavChildActive, officialWebUrl, topLinks } from '../../data/nav';

/**
 * 본 사이트(`http://gwangju2020.madiclinic.co.kr`) 헤더의 1px 재현.
 *
 * 마크업 정본은 `docs/assets/madiclinic-header/header.html`이다. 클래스명·id·
 * 중첩 구조를 바꾸지 않는다 - `src/styles/madi/header.css`가 원본 선택자
 * (`#header .headerFix .naviArea .menuNavi > li:nth-child(4)` 등)에 그대로
 * 기대고 있어서, 래퍼 하나만 끼워도 치수가 어긋난다.
 *
 * 링크만 본 사이트 절대주소로 바꿨다(PLAN.md §3.4). 원본의 `href="/"`는
 * 이 서브도메인에서 `/column`으로 301되므로 "처음으로"가 성립하지 않는다.
 *
 * 동작은 `MadiHeaderBehavior`(client)가 이 DOM에 붙는다.
 *
 * 원본에서 `#header` 바로 앞에 있는 `#skipBind`는 `components/site/SkipLink`가
 * 맡는다. 포커스를 실제로 `<main>`으로 옮기려면 클라이언트 컴포넌트가 필요하고,
 * `SiteLayout`이 body 최상단에 둬서 DOM 순서는 원본과 같다.
 */
export default function MadiHeader({ pathname }: Readonly<{ pathname: string }>) {
  const blogActive = isBlogPath(pathname);

  return (
    <>
      <div id="pageBlack" />
      <div id="header">
        <div className="headerFix slideanim4">
          <div className="topLineArea">
            <div className="topLineBox">
              <ul className="contact">
                {branchTabs.map((tab) => (
                  <li key={tab.label}>
                    <a
                      href={tab.href}
                      className={tab.current ? 'on' : undefined}
                      {...(tab.current ? {} : { target: '_blank' })}
                    >
                      {tab.label}
                    </a>
                  </li>
                ))}
              </ul>
              <ul className="topLink clearFix">
                {topLinks.map((link) => (
                  <li key={link.className}>
                    <a
                      href={link.href}
                      className={link.className}
                      title={link.title}
                      {...(link.external ? { target: '_blank' } : {})}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="naviArea clearFix">
            <h1 className="ci">
              <a href={topLinks[0]?.href ?? '/'}>
                <img src="/madi/img/hi_gwangju2020_20240826.png" alt="광주 남구 마디클리닉" />
              </a>
            </h1>
            <div id="naviBlack" />
            <div className="mobileHome">
              <h1 className="logo">
                <a href={topLinks[0]?.href ?? '/'}>
                  <img src="/madi/img/mobileHi_gwangju2020_20240826.png" alt="마디클리닉" />
                </a>
              </h1>
            </div>

            <div id="naviToggle" title="전체메뉴 열기">
              <div id="line-wrapper">
                <div id="line-top" className="line init top-reverse" />
                <div id="line-mid" className="line init mid-reverse" />
                <div id="line-bot" className="line init bot-reverse" />
              </div>
            </div>

            <ul className="menuNavi clearFix" id="gnb">
              {gnb.map((item, index) => {
                const itemActive = blogActive && item.href.startsWith('/');
                return (
                  <li key={item.label} className={itemActive ? 'clearFix fix' : 'clearFix'}>
                    <div className="menuLine" />
                    <a href={item.href} className="subHave" aria-current={itemActive ? 'true' : undefined}>
                      {item.label}
                    </a>
                    <ul className={`subMenu sm0${index + 1} clearFix`}>
                      <li className="topLine" />
                      {item.children.map((child) => {
                        const childActive = blogActive && isNavChildActive(child.href, pathname);
                        return (
                          <li key={child.label} className={childActive ? 'on clearFix' : undefined}>
                            <a href={child.href} aria-current={childActive ? 'page' : undefined}>{child.label}</a>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <div className="officialWeb">
              <a href={officialWebUrl} target="_blank">
                <span />
                통합마디클리닉 <u>바로가기</u>
              </a>
            </div>
          </div>
        </div>
      </div>
      <MadiHeaderBehavior />
    </>
  );
}
