import type { Metadata } from 'next';

import '../../styles/site/faq.css';
import FaqHomePage from '../../features/faq/FaqHomePage';
import { faqIndexMetadata } from '../../features/faq/faq-content';
import { resolveFaqCollection } from '../../features/faq/faq-source';

/**
 * 데이터는 24시간 `unstable_cache`가 잡고 렌더링은 요청 시점에 한다. 정적
 * 프리렌더를 하면 빌드 순간의 CMS 상태가 굳어 런타임의 비밀값·장애가 반영되지
 * 않는다(칼럼·후기와 같은 판정).
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: faqIndexMetadata.title },
  description: faqIndexMetadata.description,
  alternates: {
    canonical: '/faq',
    types: { 'application/rss+xml': '/faq/rss.xml' },
  },
};

export default async function FaqIndexRoute() {
  return <FaqHomePage collection={await resolveFaqCollection()} />;
}
