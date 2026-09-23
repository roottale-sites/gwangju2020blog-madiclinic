/**
 * 헤더 내비게이션 데이터 (PLAN.md §3.4).
 *
 * 본 사이트의 GNB 5개와 하위 메뉴 명칭·순서를 그대로 유지한다.
 * 기존 진료 메뉴 4개는 본 사이트 절대주소로 연결하고, 원본의 `커뮤니티`
 * 하위 블로그·자주 묻는 질문·후기만 이 저장소 화면으로 연결한다.
 */

/** 본 사이트 원본. GNB 기존 4개 항목의 절대주소 기준. */
export const mainSiteOrigin = 'https://gwangju2020.madiclinic.co.kr';

export type NavChild = Readonly<{ label: string; href: string }>;
export type NavItem = Readonly<{ label: string; href: string; children: readonly NavChild[] }>;

/** GNB·서브 메뉴·위치 표시줄이 함께 사용하는 커뮤니티 연결. */
export const communityNav: NavItem = {
  label: '커뮤니티',
  href: '/column',
  children: [
    { label: '블로그', href: '/column' },
    { label: '자주 묻는 질문', href: '/faq' },
    { label: '후기', href: '/reviews' },
  ],
};

/** 1차 메뉴. 폭은 원본과 같은 header.css 값이다(95/95/95/140/95 = 520px). */
export const gnb: readonly NavItem[] = [
  {
    label: '원장 소개',
    href: `${mainSiteOrigin}/doctor/doctor01.html`,
    children: [
      { label: '인사말', href: `${mainSiteOrigin}/doctor/doctor01.html` },
      { label: '프로필', href: `${mainSiteOrigin}/doctor/doctor02.html` },
    ],
  },
  {
    label: '병원 소개',
    href: `${mainSiteOrigin}/about/about01.html`,
    children: [
      { label: '시설 소개', href: `${mainSiteOrigin}/about/about01.html` },
      { label: '오시는 길', href: `${mainSiteOrigin}/about/about02.html` },
    ],
  },
  {
    label: '진료 안내',
    href: `${mainSiteOrigin}/clinic/clinic01.html`,
    children: [
      { label: '진료 안내', href: `${mainSiteOrigin}/clinic/clinic01.html` },
      { label: '비급여 항목', href: `${mainSiteOrigin}/clinic/clinic02.html` },
    ],
  },
  {
    label: '비수술 중점치료',
    href: `${mainSiteOrigin}/special/special01.html`,
    children: [
      { label: '인대증식술', href: `${mainSiteOrigin}/special/special01.html` },
      { label: 'ESWT', href: `${mainSiteOrigin}/special/special02.html` },
      { label: '신경차단술', href: `${mainSiteOrigin}/special/special03.html` },
      { label: '도수치료', href: `${mainSiteOrigin}/special/special04.html` },
      { label: 'IVNT', href: `${mainSiteOrigin}/special/special05.html` },
    ],
  },
  communityNav,
];

/** 이 저장소가 담당하는 블로그 라우트. 현재 경로가 이 중 하나면 `커뮤니티`에 원본의 `fix`. */
const blogPrefixes = ['/column', '/reviews', '/faq'] as const;

/** 블로그 라우트 여부. `/column/foo`처럼 하위 경로도 포함한다. */
export function isBlogPath(pathname: string): boolean {
  return blogPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 하위 항목 활성 여부.
 *
 * 본 사이트 서브 페이지는 현재 1차·2차 항목에 `on`을 준다. 블로그도 같게
 * 맞춘다. `/column`이 `커뮤니티`의 첫 항목이자 1차 링크이므로, `/reviews`를
 * 볼 때 `/column`이 켜지지 않도록 프리픽스로 비교한다.
 */
export function isNavChildActive(childHref: string, pathname: string): boolean {
  if (!childHref.startsWith('/')) return false;
  return pathname === childHref || pathname.startsWith(`${childHref}/`);
}

/** 상단 띠 지점 탭. 4번째(광주 Dr.이 마디)가 이 사이트의 본원이라 `on` 고정. */
export const branchTabs: readonly Readonly<{
  label: string;
  href: string;
  current: boolean;
}>[] = [
  { label: '전주마디', href: 'https://jeonju.madiclinic.co.kr/', current: false },
  { label: '제주마디', href: 'https://jeju.madiclinic.co.kr/', current: false },
  { label: '광주 Dr.윤 마디', href: 'https://gwangju2015.madiclinic.co.kr/', current: false },
  { label: '광주 Dr.이 마디', href: `${mainSiteOrigin}/`, current: true },
];

/** 상단 띠 아이콘 5개. 클래스명이 header.css의 배경 이미지를 고른다. */
export const topLinks: readonly Readonly<{
  className: 'home' | 'naver' | 'kakao' | 'instagram' | 'youtube';
  href: string;
  title: string;
  external: boolean;
}>[] = [
  { className: 'home', href: `${mainSiteOrigin}/`, title: '처음으로', external: false },
  {
    className: 'naver',
    href: 'https://m.booking.naver.com/booking/13/bizes/823238?theme=place&area=pll',
    title: 'Naver',
    external: true,
  },
  { className: 'kakao', href: 'https://pf.kakao.com/_YIYSxj', title: 'Kakao', external: true },
  {
    className: 'instagram',
    href: 'https://instagram.com/madiclinic2020',
    title: 'Instagram',
    external: true,
  },
  {
    className: 'youtube',
    href: 'https://youtube.com/@practicalpainmanagementwit8115',
    title: 'Youtube',
    external: true,
  },
];

/** 헤더 우측 버튼. */
export const officialWebUrl = 'https://www.madiclinic.co.kr/';
