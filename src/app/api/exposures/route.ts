import { createExposureRoute } from '@roottale/cms-renderer-next/routes';
import { EXPOSURE_HOME_PATHS, EXPOSURE_SLOT_KEYS } from '../../../features/exposures/contract';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  return createExposureRoute({
    apiKey: apiKey === 'local_unconfigured' ? '' : apiKey ?? '',
    baseUrl: process.env.ROOTTALE_API_BASE?.trim() || undefined,
    slots: EXPOSURE_SLOT_KEYS,
    homePaths: EXPOSURE_HOME_PATHS,
  })(request);
}
