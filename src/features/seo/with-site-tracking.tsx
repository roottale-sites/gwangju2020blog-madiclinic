import { googleTagManagerSnippet } from '@roottale/cms-client/server';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { siteOrigin } from '../../data/site';
import { loadSiteIntegrations } from './site-verification';

const productionHost = new URL(siteOrigin).host;

/**
 * layout은 자식의 404를 판정할 수 없으므로, notFound·주소 이동을 해결한
 * 공개 페이지에만 연결한다. /preview에는 연결하지 않는다.
 */
export function withSiteTracking<Props>(renderPage: (props: Props) => Promise<ReactNode>) {
  return async function TrackedPage(props: Props) {
    const content = await renderPage(props);
    const requestHeaders = await headers();
    const enabled = process.env.VERCEL_ENV === 'production' &&
      requestHeaders.get('host')?.toLowerCase() === productionHost &&
      requestHeaders.get('sec-fetch-dest') !== 'iframe';
    const integrations = enabled ? await loadSiteIntegrations() : undefined;
    const gtm = googleTagManagerSnippet(integrations?.googleTagManagerId);
    return <>
      {gtm ? <>
        <script id="google-tag-manager" dangerouslySetInnerHTML={{ __html: gtm.script }} />
        <noscript><iframe title="Google Tag Manager" src={gtm.iframeUrl}
          height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} /></noscript>
      </> : null}
      {content}
    </>;
  };
}
