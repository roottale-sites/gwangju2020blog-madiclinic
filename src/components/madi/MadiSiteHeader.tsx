'use client';

import { usePathname } from 'next/navigation';
import MadiHeader from './MadiHeader';

/** 공통 레이아웃에 유지되는 헤더. 경로가 바뀌면 현재 메뉴만 갱신한다. */
export default function MadiSiteHeader() {
  const pathname = usePathname();
  return <MadiHeader pathname={pathname} />;
}
