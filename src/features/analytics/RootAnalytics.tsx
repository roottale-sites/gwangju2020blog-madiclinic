import { Suspense } from 'react';
import {
  buildManifest, renderBeaconScript, renderConsentBootstrap, renderGa4BridgeScript,
  renderJourneyBridgeScript, renderLoaderScript,
} from '@roottale/analytics-runtime';
import { siteOrigin } from '../../data/site';
import { RootAnalyticsClient } from './RootAnalyticsClient';
import { loadRootAnalyticsConfig } from './root-analytics-config';

export async function RootAnalytics() {
  const config = await loadRootAnalyticsConfig();
  if (!config) return null;
  const manifest = buildManifest(config);
  const productionHost = JSON.stringify(new URL(siteOrigin).hostname);
  const beacon = (collectUrl: string) => renderBeaconScript({ collectUrl, siteId: config.siteId, trackPageview: false });
  // 로컬·미리보기에서는 같은 SDK를 사용하되 운영 통계로 전송하지 않는다.
  const script = renderJourneyBridgeScript() +
    `if(location.hostname===${productionHost}){` +
    (manifest.tags.length ? renderConsentBootstrap() + renderLoaderScript(manifest) + renderGa4BridgeScript() : '') +
    beacon(config.collectUrl) + '}else{' + beacon('/api/analytics/debug') + '}' +
    'window.dispatchEvent(new Event("rt:analytics-ready"));';
  return <>
    <script dangerouslySetInnerHTML={{ __html: script }} />
    <Suspense fallback={null}><RootAnalyticsClient /></Suspense>
  </>;
}
