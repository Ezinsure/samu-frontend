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
  /** Marks province/district/sector/cell as required (red *). */
  required?: boolean;
}

export function CascadingGeoFields({
  value,
  onChange,
  kinyarwanda = false,
  showVillage = true,
  required = false,
}: CascadingGeoFieldsProps) {
  const districts = districtsForProvince(value.province);

  return (
    <>
      <FormField
        label={kinyarwanda ? "Intara (Province)" : "Province"}
        required={required}
      >
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
      <FormField
        label={kinyarwanda ? "Akarere" : "District"}
        required={required}
      >
        <OptionSelect
          value={value.district}
          onChange={(district) => onChange({ ...value, district })}
          options={districts.map((d) => ({ value: d, label: d }))}
        />
      </FormField>
      <FormField
        label={kinyarwanda ? "Umurenge" : "Sector"}
        required={required}
      >
        <Input
          value={value.sector}
          onChange={(e) => onChange({ ...value, sector: e.target.value })}
          placeholder={kinyarwanda ? "Andika umurenge" : "Sector"}
          required={required}
        />
      </FormField>
      <FormField label={kinyarwanda ? "Akagari" : "Cell"} required={required}>
        <Input
          value={value.cell}
          onChange={(e) => onChange({ ...value, cell: e.target.value })}
          placeholder={kinyarwanda ? "Andika akagari" : "Cell"}
          required={required}
        />
      </FormField>
      {showVillage ? (
        <FormField
          label={kinyarwanda ? "Umudugudu" : "Village"}
          required={required}
        >
          <Input
            value={value.village ?? ""}
            onChange={(e) => onChange({ ...value, village: e.target.value })}
            placeholder={kinyarwanda ? "Andika umudugudu" : "Village"}
            required={required}
          />
        </FormField>
      ) : null}
    </>
  );
}
