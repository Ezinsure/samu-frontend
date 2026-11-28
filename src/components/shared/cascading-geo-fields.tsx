"use client";

import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import {
  districtsForProvince,
  listCells,
  listSectors,
  listVillages,
  normalizeProvinceName,
  RWANDA_PROVINCE_LIST,
  type GeoDepth,
} from "@/lib/geo/rwanda-locations";

export interface CascadingGeoValue {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village?: string;
}

interface CascadingGeoFieldsProps {
  value: CascadingGeoValue;
  onChange: (next: CascadingGeoValue) => void;
  /** When true, show Kinyarwanda labels for public forms. */
  kinyarwanda?: boolean;
  /**
   * Deepest level to show.
   * - district: province + district
   * - sector: + sector
   * - cell: + cell
   * - village: + village
   */
  depth?: GeoDepth;
  /** @deprecated Use `depth="village"` or omit village via `depth="cell"`. */
  showVillage?: boolean;
  /** Marks visible fields as required (red *). */
  required?: boolean;
}

function withCurrent(current: string, items: string[]) {
  return Array.from(new Set([current, ...items].filter(Boolean))).map(
    (item) => ({ value: item, label: item }),
  );
}

function resolveDepth(
  depth: GeoDepth | undefined,
  showVillage: boolean | undefined,
): GeoDepth {
  if (depth) return depth;
  if (showVillage === false) return "cell";
  return "village";
}

export function CascadingGeoFields({
  value,
  onChange,
  kinyarwanda = false,
  depth,
  showVillage,
  required = false,
}: CascadingGeoFieldsProps) {
  const resolvedDepth = resolveDepth(depth, showVillage);
  const province =
    normalizeProvinceName(value.province) ||
    value.province ||
    RWANDA_PROVINCE_LIST[0] ||
    "Kigali City";
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
  const cells = listCells(sector, district, province).map((c) => c.name);
  const cell =
    value.cell && cells.includes(value.cell)
      ? value.cell
      : (cells[0] ?? value.cell);
  const villages = listVillages(cell, sector, district, province).map(
    (v) => v.name,
  );
  const village =
    value.village && villages.includes(value.village)
      ? value.village
      : (villages[0] ?? value.village ?? "");

  const showSector =
    resolvedDepth === "sector" ||
    resolvedDepth === "cell" ||
    resolvedDepth === "village";
  const showCell = resolvedDepth === "cell" || resolvedDepth === "village";
  const showVillageField = resolvedDepth === "village";

  function pickChildren(next: {
    province: string;
    district: string;
    sector?: string;
    cell?: string;
  }): CascadingGeoValue {
    const nextDistricts = districtsForProvince(next.province);
    const nextDistrict =
      next.district && nextDistricts.includes(next.district)
        ? next.district
        : (nextDistricts[0] ?? "");
    const nextSectors = listSectors(nextDistrict, next.province).map(
      (s) => s.name,
    );
    const nextSector =
      next.sector && nextSectors.includes(next.sector)
        ? next.sector
        : (nextSectors[0] ?? "");
    const nextCells = listCells(nextSector, nextDistrict, next.province).map(
      (c) => c.name,
    );
    const nextCell =
      next.cell && nextCells.includes(next.cell)
        ? next.cell
        : (nextCells[0] ?? "");
    const nextVillages = listVillages(
      nextCell,
      nextSector,
      nextDistrict,
      next.province,
    ).map((v) => v.name);
    return {
      province: next.province,
      district: nextDistrict,
      sector: nextSector,
      cell: nextCell,
      village: nextVillages[0] ?? "",
    };
  }

  return (
    <>
      <FormField
        label={kinyarwanda ? "Intara (Province)" : "Province"}
        required={required}
      >
        <OptionSelect
          value={province}
          onChange={(nextProvince) =>
            onChange(pickChildren({ province: nextProvince, district: "" }))
          }
          options={RWANDA_PROVINCE_LIST.map((p) => ({ value: p, label: p }))}
        />
      </FormField>
      <FormField
        label={kinyarwanda ? "Akarere" : "District"}
        required={required}
      >
        <OptionSelect
          value={district || districts[0] || value.district}
          onChange={(nextDistrict) =>
            onChange(
              pickChildren({
                province,
                district: nextDistrict,
              }),
            )
          }
          options={withCurrent(district, districts)}
        />
      </FormField>
      {showSector ? (
        <FormField
          label={kinyarwanda ? "Umurenge" : "Sector"}
          required={required}
        >
          <OptionSelect
            value={sector || sectors[0] || value.sector}
            onChange={(nextSector) =>
              onChange(
                pickChildren({
                  province,
                  district,
                  sector: nextSector,
                }),
              )
            }
            options={withCurrent(sector, sectors)}
          />
        </FormField>
      ) : null}
      {showCell ? (
        <FormField
          label={kinyarwanda ? "Akagari" : "Cell"}
          required={required}
        >
          <OptionSelect
            value={cell || cells[0] || value.cell}
            onChange={(nextCell) =>
              onChange(
                pickChildren({
                  province,
                  district,
                  sector,
                  cell: nextCell,
                }),
              )
            }
            options={withCurrent(cell, cells)}
          />
        </FormField>
      ) : null}
      {showVillageField ? (
        <FormField
          label={kinyarwanda ? "Umudugudu" : "Village"}
          required={required}
        >
          <OptionSelect
            value={village || villages[0] || value.village || ""}
            onChange={(nextVillage) =>
              onChange({
                province,
                district,
                sector,
                cell,
                village: nextVillage,
              })
            }
            options={withCurrent(village, villages)}
          />
        </FormField>
      ) : null}
    </>
  );
}
