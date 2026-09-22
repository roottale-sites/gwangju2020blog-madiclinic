import slots from '../../../cms/exposure-slots.json';

export const POPUP_SLOT = slots[0]!;
export const EXPOSURE_SLOT_KEYS = slots.map((slot) => slot.key);
export const EXPOSURE_HOME_PATHS = POPUP_SLOT.homePaths;
