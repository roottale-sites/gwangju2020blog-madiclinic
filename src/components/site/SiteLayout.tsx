import type { SiteContent } from '../../features/site-content/bindings';
import type { ReactNode } from 'react';

import SkipLink from './SkipLink';
import MadiSiteHeader from '../madi/MadiSiteHeader';
import MadiFooter from '../madi/MadiFooter';
import { RootTaleImageLightbox } from '../../features/cms/ImageLightbox';
import SitePopups from '../../features/exposures/SitePopups';
import '@roottale/cms-renderer-next/styles';
import '../../styles/site/popups.css';

export default function SiteLayout({ children, content }: Readonly<{ children: ReactNode; content?: SiteContent }>) {
  return (
    <>
      <SkipLink />
      <MadiSiteHeader />
      <RootTaleImageLightbox imageSelector=".column-richtext img, .column-imported-html img, .review-richtext img, .faq-richtext img">
        {children}
      </RootTaleImageLightbox>
      <MadiFooter content={content} />
      <SitePopups />
    </>
  );
}
