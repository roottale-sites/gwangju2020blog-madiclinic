import type { ReactNode } from 'react';

import SkipLink from './SkipLink';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <SkipLink />
      {children}
    </>
  );
}
