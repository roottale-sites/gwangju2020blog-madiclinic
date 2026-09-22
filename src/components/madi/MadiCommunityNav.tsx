import { communityNav, isNavChildActive } from '../../data/nav';

/** 원본 서브 페이지의 배너 하단 메뉴를 커뮤니티 세 화면에 동일하게 적용한다. */
export default function MadiCommunityNav({ pathname }: Readonly<{ pathname: string }>) {
  return (
    <nav id="subHeader" aria-label="커뮤니티 메뉴">
      <div className="subHeaderFix">
        <div className="subMenuArea">
          <ul className="subMenuNavi tab3 clearFix">
            {communityNav.children.map((item) => {
              const active = isNavChildActive(item.href, pathname);
              return (
                <li key={item.href} className={active ? 'on' : undefined}>
                  <a href={item.href} aria-current={active ? 'page' : undefined}>{item.label}</a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
