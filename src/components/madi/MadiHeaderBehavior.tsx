'use client';

import { useEffect } from 'react';
import { createSubmenuMotion } from './submenu-motion';

/**
 * 본 사이트 헤더 동작을 jQuery 없이 재현한다.
 *
 * 정본은 `docs/assets/madiclinic-header/header-behavior.js`(원본 `/js/common.js`).
 * 원본은 `#naviToggle`의 `display`로 PC/MO를 가른 뒤 두 스크립트가 서로의
 * 인라인 스타일을 되돌리며 산다. 그래서 여기서도 상태를 React state가 아니라
 * 원본과 같은 인라인 스타일·클래스로 둔다. 서버 렌더된 마크업
 * (`MadiHeader`)에 직접 붙어야 header.css가 기대는 선택자 구조가 유지된다.
 *
 * 폭 경계 980px은 header.css의 `@media screen and (max-width: 980px)`와 같은
 * 값이다. 두 곳이 어긋나면 드로어가 열린 채 PC 레이아웃이 나온다.
 */

/** 원본 스크립트가 쓰는 드로어 닫힘 위치. header.css의 -270px보다 크다(원본 그대로). */
const DRAWER_CLOSED = '-320px';

const MOBILE_QUERY = '(max-width: 980px)';

export default function MadiHeaderBehavior() {
  useEffect(() => {
    const header = document.getElementById('header');
    const menuNavi = document.querySelector<HTMLElement>('#header .menuNavi');
    const naviToggle = document.getElementById('naviToggle');
    const naviBlack = document.getElementById('naviBlack');
    const mobileHome = document.querySelector<HTMLElement>('#header .mobileHome');
    const topLink = document.querySelector<HTMLElement>('#header ul.topLink');
    const officialWeb = document.querySelector<HTMLElement>('#header .officialWeb');
    if (!header || !menuNavi || !naviToggle || !naviBlack) return;

    const { slideDown, slideUp, dispose } = createSubmenuMotion();

    // 원본 L64-83: 헤더 첫 등장. 스크롤 감시 없이 클래스만 준다.
    document.querySelectorAll('.slideanim4').forEach((el) => el.classList.add('slideDown'));

    const topItems = Array.from(menuNavi.querySelectorAll<HTMLElement>(':scope > li'));
    const subMenus = topItems
      .map((li) => li.querySelector<HTMLElement>(':scope > ul'))
      .filter((ul): ul is HTMLElement => ul !== null);

    function collapseAll({ instant = false } = {}) {
      topItems.forEach((li) => li.classList.remove('on'));
      subMenus.forEach((ul) => slideUp(ul, { instant }));
    }

    function toggleAni() {
      document.querySelectorAll('#naviToggle .line').forEach((el) => el.classList.remove('init'));
      document.getElementById('line-top')?.classList.toggle('line-top');
      document.getElementById('line-top')?.classList.toggle('top-reverse');
      document.getElementById('line-mid')?.classList.toggle('line-mid');
      document.getElementById('line-mid')?.classList.toggle('mid-reverse');
      document.getElementById('line-bot')?.classList.toggle('line-bot');
      document.getElementById('line-bot')?.classList.toggle('bot-reverse');
      if (document.getElementById('line-top')?.classList.contains('line-top')) {
        naviToggle?.classList.add('on');
      } else {
        naviToggle?.classList.remove('on');
      }
    }

    function closeDrawer() {
      document.body.style.overflow = 'visible';
      if (mobileHome) mobileHome.style.right = DRAWER_CLOSED;
      menuNavi!.style.display = 'none';
      menuNavi!.style.right = DRAWER_CLOSED;
      collapseAll({ instant: true });
      naviBlack!.style.zIndex = '-1';
      naviBlack!.style.right = '-100%';
      if (topLink) {
        topLink.style.display = 'none';
        topLink.style.right = DRAWER_CLOSED;
      }
      if (officialWeb) {
        officialWeb.style.display = 'none';
        officialWeb.style.right = DRAWER_CLOSED;
      }
      naviToggle!.setAttribute('title', '전체메뉴 열기');
    }

    function openDrawer() {
      document.body.style.overflow = 'hidden';
      if (mobileHome) mobileHome.style.right = '0';
      menuNavi!.style.display = 'block';
      menuNavi!.style.right = '0';
      naviBlack!.style.right = '0';
      naviBlack!.style.zIndex = '10';
      if (topLink) {
        topLink.style.display = 'block';
        topLink.style.right = '0px';
      }
      if (officialWeb) {
        officialWeb.style.display = 'block';
        officialWeb.style.right = '0px';
      }
      naviToggle!.setAttribute('title', '전체메뉴 닫기');
    }

    /** 원본 `getPcScript`. 모바일이 남긴 인라인 스타일을 되돌린 뒤 hover를 붙인다. */
    function enterPcMode(): () => void {
      naviBlack!.style.zIndex = '-1';
      naviBlack!.style.right = '-100%';
      document.body.style.overflow = 'visible';
      menuNavi!.style.display = 'block';
      menuNavi!.style.right = '';
      if (mobileHome) mobileHome.style.right = '';
      collapseAll({ instant: true });
      if (topLink) {
        topLink.style.display = 'block';
        topLink.style.right = '';
      }
      if (officialWeb) {
        officialWeb.style.display = 'block';
        officialWeb.style.right = '';
      }
      naviToggle!.classList.remove('on');

      const open = (event: Event) => {
        const anchor = event.currentTarget as HTMLElement;
        const li = anchor.parentElement;
        if (!li) return;
        if (!li.classList.contains('on')) {
          collapseAll();
        } else {
          topItems.forEach((item) => item.classList.remove('on'));
        }
        li.classList.add('on');
        const sub = anchor.nextElementSibling;
        if (sub instanceof HTMLElement) slideDown(sub);
      };
      const leave = () => collapseAll();
      const outsideFocus = (event: FocusEvent) => {
        const target = event.target;
        if (target instanceof Node && menuNavi!.contains(target)) return;
        collapseAll();
      };

      const anchors = topItems
        .map((li) => li.querySelector<HTMLElement>(':scope > a'))
        .filter((a): a is HTMLElement => a !== null);
      anchors.forEach((a) => {
        a.addEventListener('mouseenter', open);
        a.addEventListener('focusin', open);
      });
      menuNavi!.addEventListener('mouseleave', leave);
      document.addEventListener('focusin', outsideFocus);

      return () => {
        anchors.forEach((a) => {
          a.removeEventListener('mouseenter', open);
          a.removeEventListener('focusin', open);
        });
        menuNavi!.removeEventListener('mouseleave', leave);
        document.removeEventListener('focusin', outsideFocus);
      };
    }

    /** 원본 `getMobileScript`. 드로어를 닫힌 상태로 초기화한 뒤 토글을 붙인다. */
    function enterMobileMode(): () => void {
      menuNavi!.style.display = 'none';
      document.body.style.overflow = 'visible';
      naviBlack!.style.zIndex = '-1';
      naviBlack!.style.right = '-100%';
      if (mobileHome) mobileHome.style.right = DRAWER_CLOSED;
      menuNavi!.style.right = DRAWER_CLOSED;
      collapseAll({ instant: true });
      if (officialWeb) officialWeb.style.display = 'none';
      if (naviToggle!.classList.contains('on')) toggleAni();

      const onToggle = () => {
        toggleAni();
        if (menuNavi!.style.right === '0px' || menuNavi!.style.right === '0') {
          closeDrawer();
        } else {
          openDrawer();
        }
      };
      const onItemClick = (event: Event) => {
        event.preventDefault();
        const anchor = event.currentTarget as HTMLAnchorElement;
        if (anchor.getAttribute('class') === 'subNone') {
          collapseAll({ instant: true });
          window.location.href = anchor.href;
          return;
        }
        const li = anchor.parentElement;
        const sub = li?.querySelector<HTMLElement>(':scope > ul');
        if (!li || !sub) return;
        if (window.getComputedStyle(sub).display === 'none') {
          li.classList.add('on');
          slideDown(sub);
        } else {
          li.classList.remove('on');
          slideUp(sub);
        }
      };

      /*
       * 원본 L247-264: 드로어 밖으로 포커스가 나가면 닫는다. 원본은 닫힘
       * 상태에서도 toggleAni()를 불러 햄버거만 X로 바뀌는 버그가 있어,
       * 열려 있을 때만 닫도록 좁혔다.
       */
      const outsideFocus = (event: FocusEvent) => {
        const target = event.target;
        if (target instanceof Node && menuNavi!.contains(target)) return;
        if (menuNavi!.style.right !== '0px' && menuNavi!.style.right !== '0') return;
        toggleAni();
        closeDrawer();
      };

      naviToggle!.style.cursor = 'pointer';
      naviToggle!.addEventListener('click', onToggle);
      document.addEventListener('focusin', outsideFocus);
      const anchors = topItems
        .map((li) => li.querySelector<HTMLAnchorElement>(':scope > a'))
        .filter((a): a is HTMLAnchorElement => a !== null);
      anchors.forEach((a) => a.addEventListener('click', onItemClick));

      return () => {
        naviToggle!.removeEventListener('click', onToggle);
        document.removeEventListener('focusin', outsideFocus);
        anchors.forEach((a) => a.removeEventListener('click', onItemClick));
      };
    }

    const media = window.matchMedia(MOBILE_QUERY);
    let detach = media.matches ? enterMobileMode() : enterPcMode();
    const onChange = () => {
      detach();
      detach = media.matches ? enterMobileMode() : enterPcMode();
    };
    media.addEventListener('change', onChange);

    return () => {
      media.removeEventListener('change', onChange);
      detach();
      dispose();
      document.body.style.overflow = '';
    };
  }, []);

  return null;
}
