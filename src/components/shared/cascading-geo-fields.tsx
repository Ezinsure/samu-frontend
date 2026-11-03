"use client";

import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import {
  RWANDA_PROVINCE_LIST,
  districtsForProvince,
} from "@/lib/geo/rwanda";

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
  showVillage?: boolean;
}

export function CascadingGeoFields({
  value,
  onChange,
  kinyarwanda = false,
  showVillage = true,
}: CascadingGeoFieldsProps) {
  const districts = districtsForProvince(value.province);

  return (
    <>
      <FormField label={kinyarwanda ? "Intara (Province)" : "Province"}>
        <OptionSelect
          value={value.province}
          onChange={(province) =>
            onChange({
              ...value,
              province,
              district: districtsForProvince(province)[0] ?? "",
            })
          }
          options={RWANDA_PROVINCE_LIST.map((p) => ({ value: p, label: p }))}
        />
      </FormField>
      <FormField label={kinyarwanda ? "Akarere" : "District"}>
        <OptionSelect
          value={value.district}
          onChange={(district) => onChange({ ...value, district })}
          options={districts.map((d) => ({ value: d, label: d }))}
        />
      </FormField>
      <FormField label={kinyarwanda ? "Umurenge" : "Sector"}>
        <Input
          value={value.sector}
          onChange={(e) => onChange({ ...value, sector: e.target.value })}
          placeholder={kinyarwanda ? "Andika umurenge" : "Sector"}
        />
      </FormField>
      <FormField label={kinyarwanda ? "Akagari" : "Cell"}>
        <Input
          value={value.cell}
          onChange={(e) => onChange({ ...value, cell: e.target.value })}
          placeholder={kinyarwanda ? "Andika akagari" : "Cell"}
        />
      </FormField>
      {showVillage ? (
        <FormField label={kinyarwanda ? "Umudugudu" : "Village"}>
          <Input
            value={value.village ?? ""}
            onChange={(e) => onChange({ ...value, village: e.target.value })}
            placeholder={kinyarwanda ? "Andika umudugudu" : "Village"}
          />
        </FormField>
      ) : null}
    </>
  );
}
