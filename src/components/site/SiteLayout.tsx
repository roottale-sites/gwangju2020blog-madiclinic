import type { ReactNode } from 'react';

import SkipLink from './SkipLink';
import MadiSiteHeader from '../madi/MadiSiteHeader';
import MadiFooter from '../madi/MadiFooter';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <SkipLink />
      <MadiSiteHeader />
      {children}
      <MadiFooter />
    </>
  );
}
