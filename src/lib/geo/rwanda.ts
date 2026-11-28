/**
 * @deprecated Prefer `@/lib/geo/rwanda-locations`.
 * Re-exports keep older imports working.
 */
export {
  RWANDA_PROVINCE_LIST,
  districtsForProvince,
  provincesDistrictsMap,
  listProvinces,
  listDistricts,
  listSectors,
  listCells,
  listVillages,
  normalizeProvinceName,
  RWANDA_LOCATIONS,
} from "./rwanda-locations";

import { provincesDistrictsMap } from "./rwanda-locations";

/** @deprecated Use provincesDistrictsMap() or listDistricts(). */
export const RWANDA_PROVINCES = provincesDistrictsMap();
