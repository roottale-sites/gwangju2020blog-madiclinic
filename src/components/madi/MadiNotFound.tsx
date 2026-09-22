import Link from 'next/link';

import { clinic } from '../../data/clinic';
import { mainSiteOrigin } from '../../data/nav';
import '../../styles/site/not-found.css';

const communityLinks = [
  {
    href: '/column',
    title: '블로그',
    description: '통증의 원인과 비수술 치료에 관한 원장님의 글을 읽어보세요.',
  },
  {
    href: '/faq',
    title: '자주 묻는 질문',
    description: '증상과 검사, 치료에 관해 궁금했던 내용을 확인해 보세요.',
  },
  {
    href: '/reviews',
    title: '후기',
    description: '마디클리닉에서 진료받은 분들의 치료 경험을 살펴보세요.',
  },
] as const;

const quickLinks = [
  { href: `${mainSiteOrigin}/`, label: '병원 홈페이지', icon: 'home' },
  { href: clinic.social.naverBooking, label: '네이버 진료 예약', icon: 'calendar' },
  { href: `${mainSiteOrigin}/doctor/doctor02.html`, label: '원장 소개', icon: 'doctor' },
  { href: `${mainSiteOrigin}/about/about02.html`, label: '오시는 길', icon: 'pin' },
] as const;

function QuickLinkIcon({ icon }: Readonly<{ icon: (typeof quickLinks)[number]['icon'] }>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {icon === 'home' && <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />}
      {icon === 'calendar' && <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-11 5 2 2 4-4" /></>}
      {icon === 'doctor' && <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2M8 16v4m-2-2h4" /></>}
      {icon === 'pin' && <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
    </svg>
  );
}

/** CMS 조회 없이 공통 레이아웃 안에서 보여 주는 복귀 안내. */
export default function MadiNotFound({
  title = '페이지를 찾을 수 없습니다',
  message = '주소가 잘못 입력되었거나, 페이지가 이동 또는 삭제되었을 수 있습니다.',
}: Readonly<{ title?: string; message?: string }>) {
  return (
    <main id="main" className="not-found-page">
      <div className="not-found-page__inner">
        <section className="not-found-page__hero" aria-labelledby="not-found-title">
          <p className="not-found-page__eyebrow">PAGE NOT FOUND</p>
          <div className="not-found-page__code" aria-label="404 오류" role="img">
            <span aria-hidden="true">4</span>
            <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
              <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="3" />
              <path d="M25 62h18l9-21 15 39 10-18h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span aria-hidden="true">4</span>
          </div>
          <h2 id="not-found-title">{title}</h2>
          <p className="not-found-page__message">
            {message}<br />
            아래에서 필요한 정보를 다시 찾아보세요.
          </p>
          <a className="not-found-page__home" href={`${mainSiteOrigin}/`}>
            병원 홈페이지로 <span aria-hidden="true">↗</span>
          </a>
        </section>

        <section className="not-found-page__directory" aria-labelledby="not-found-directory-title">
          <div className="not-found-page__section-heading">
            <h3 id="not-found-directory-title">마디클리닉 이야기</h3>
            <p>궁금했던 건강 정보를 이어서 만나보세요.</p>
          </div>
          <ul className="not-found-page__cards">
            {communityLinks.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <span className="not-found-page__card-number" aria-hidden="true">0{index + 1}</span>
                  <h4>{link.title}</h4>
                  <p>{link.description}</p>
                  <span className="not-found-page__card-link">{link.title} 보기 <span aria-hidden="true">→</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <nav className="not-found-page__quick-links" aria-labelledby="not-found-quick-title">
          <h3 id="not-found-quick-title">병원 이용 안내</h3>
          <ul>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>
                  <QuickLinkIcon icon={link.icon} />
                  <span>{link.label}</span>
                  <span className="not-found-page__quick-arrow" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
