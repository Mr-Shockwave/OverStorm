/** Re-exports map constants from asset data for backward compatibility. */

import {
  HURRICANE_MILTON_HISTORICAL,
  MIAMI_BEACH_CENTER,
  MIAMI_BEACH_RISK_ZONES,
  MIAMI_COASTAL_ASSETS,
} from "./assetData";

export {
  HURRICANE_MILTON_HISTORICAL,
  MIAMI_BEACH_CENTER,
  MIAMI_BEACH_RISK_ZONES,
  MIAMI_COASTAL_ASSETS,
};

/** @deprecated Use HURRICANE_MILTON_HISTORICAL.stormTrack */
export const HURRICANE_MILTON_TRACK = HURRICANE_MILTON_HISTORICAL.stormTrack;
