import type { ReactNode } from 'react';

import SkipLink from './SkipLink';
import MadiSiteHeader from '../madi/MadiSiteHeader';
import MadiFooter from '../madi/MadiFooter';
import { RootTaleImageLightbox } from '../../features/cms/ImageLightbox';

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <SkipLink />
      <MadiSiteHeader />
      <RootTaleImageLightbox imageSelector=".column-richtext img, .column-imported-html img, .review-richtext img, .review-detail__original img, .faq-richtext img">
        {children}
      </RootTaleImageLightbox>
      <MadiFooter />
    </>
  );
}
