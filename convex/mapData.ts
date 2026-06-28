/** Re-exports map constants from asset data for backward compatibility. */

import {
  HURRICANE_WILMA_HISTORICAL,
  MIAMI_BEACH_CENTER,
  MIAMI_COASTAL_ASSETS,
  WILMA_RISK_ZONES,
} from "./assetData";

export {
  HURRICANE_WILMA_HISTORICAL,
  MIAMI_BEACH_CENTER,
  MIAMI_COASTAL_ASSETS,
  WILMA_RISK_ZONES,
};

/** @deprecated Use HURRICANE_WILMA_HISTORICAL.stormTrack */
export const HURRICANE_WILMA_TRACK = HURRICANE_WILMA_HISTORICAL.stormTrack;
