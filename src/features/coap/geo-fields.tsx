import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import type { CoapFilterOptions } from "@/lib/api";

export interface GeoValue {
  province: string;
  district: string;
  sector: string;
}

interface GeoFieldsProps {
  value: GeoValue;
  onChange: (next: GeoValue) => void;
  /** `null` while options load — the current value is still selectable. */
  options: Pick<CoapFilterOptions, "provinces" | "districts" | "sectors"> | null;
}

/** The current value must stay selectable even if it is not in the option list. */
function withCurrent(current: string, items: string[] | undefined) {
  return Array.from(new Set([current, ...(items ?? [])])).map((item) => ({
    value: item,
    label: item,
  }));
}

/** Province / district / sector selects shared by every COAP form. */
export function GeoFields({ value, onChange, options }: GeoFieldsProps) {
  return (
    <>
      <FormField label="Province">
        <OptionSelect
          value={value.province}
          onChange={(province) => onChange({ ...value, province })}
          options={withCurrent(value.province, options?.provinces)}
        />
      </FormField>
      <FormField label="District">
        <OptionSelect
          value={value.district}
          onChange={(district) => onChange({ ...value, district })}
          options={withCurrent(value.district, options?.districts)}
        />
      </FormField>
      <FormField label="Sector">
        <OptionSelect
          value={value.sector}
          onChange={(sector) => onChange({ ...value, sector })}
          options={withCurrent(value.sector, options?.sectors)}
        />
      </FormField>
    </>
  );
}
