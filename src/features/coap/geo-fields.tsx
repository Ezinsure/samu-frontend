"use client";

import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import {
  districtsForProvince,
  listSectors,
  normalizeProvinceName,
  RWANDA_PROVINCE_LIST,
} from "@/lib/geo/rwanda-locations";

export interface GeoValue {
  province: string;
  district: string;
  sector: string;
}

interface GeoFieldsProps {
  value: GeoValue;
  onChange: (next: GeoValue) => void;
  /**
   * Kept for call-site compatibility with COAP forms that still pass
   * filter options. Location lists now come from the canonical dataset.
   */
  options?: unknown;
}

/** Keep a legacy/free-text value selectable even if it is not in the catalog. */
function withCurrent(current: string, items: string[]) {
  return Array.from(new Set([current, ...items].filter(Boolean))).map(
    (item) => ({
      value: item,
      label: item,
    }),
  );
}

/** Province → district → sector cascading selects for COAP forms. */
export function GeoFields({ value, onChange }: GeoFieldsProps) {
  const province = normalizeProvinceName(value.province) || value.province;
  const districts = districtsForProvince(province);
  const district =
    value.district && districts.includes(value.district)
      ? value.district
      : (districts[0] ?? value.district);
  const sectors = listSectors(district, province).map((s) => s.name);
  const sector =
    value.sector && sectors.includes(value.sector)
      ? value.sector
      : (sectors[0] ?? value.sector);

  return (
    <>
      <FormField label="Province" required>
        <OptionSelect
          value={province || RWANDA_PROVINCE_LIST[0] || "Kigali City"}
          onChange={(nextProvince) => {
            const firstDistrict = districtsForProvince(nextProvince)[0] ?? "";
            const firstSector =
              listSectors(firstDistrict, nextProvince)[0]?.name ?? "";
            onChange({
              province: nextProvince,
              district: firstDistrict,
              sector: firstSector,
            });
          }}
          options={RWANDA_PROVINCE_LIST.map((p) => ({ value: p, label: p }))}
        />
      </FormField>
      <FormField label="District" required>
        <OptionSelect
          value={district || districts[0] || value.district}
          onChange={(nextDistrict) => {
            const firstSector =
              listSectors(nextDistrict, province)[0]?.name ?? "";
            onChange({
              province,
              district: nextDistrict,
              sector: firstSector,
            });
          }}
          options={withCurrent(district, districts)}
        />
      </FormField>
      <FormField label="Sector" required>
        <OptionSelect
          value={sector || sectors[0] || value.sector}
          onChange={(nextSector) =>
            onChange({ ...value, province, district, sector: nextSector })
          }
          options={withCurrent(sector, sectors)}
        />
      </FormField>
    </>
  );
}
