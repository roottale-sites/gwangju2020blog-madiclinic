'use client';

import { usePathname } from 'next/navigation';
import { RootTaleExposureProvider, RootTaleExposureSlot } from '@roottale/cms-renderer-next/exposures';
import { EXPOSURE_HOME_PATHS, EXPOSURE_SLOT_KEYS, POPUP_SLOT } from './contract';

/** 표시 조건·예약 시각·닫기 기록·관리자 미리보기는 headnerve와 같은 런타임을 쓴다. */
export default function SitePopups() {
  const pathname = usePathname();
  return (
    <RootTaleExposureProvider endpoint="/api/exposures" pathname={pathname}
      slots={EXPOSURE_SLOT_KEYS} homePaths={EXPOSURE_HOME_PATHS}>
      <RootTaleExposureSlot slotKey={POPUP_SLOT.key} placement="popup"
        className="madi-popup" allowedVariants={POPUP_SLOT.variants} />
    </RootTaleExposureProvider>
  );
}
