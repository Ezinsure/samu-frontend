import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Sentinel for the "no filter" option (Radix Select cannot use `""`). */
export const ALL_VALUE = "all";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Label of the leading "no filter" option, e.g. "All provinces". */
  allLabel: string;
  options: FilterOption[];
  /** Tailwind width class for the trigger. */
  widthClass?: string;
}

/** Single-select filter with a leading "All" option, used in list filter bars. */
export function FilterSelect({
  value,
  onChange,
  placeholder,
  allLabel,
  options,
  widthClass = "w-[160px]",
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={widthClass}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Maps a plain string list to filter options (label === value). */
export function toFilterOptions(values: string[]): FilterOption[] {
  return values.map((value) => ({ value, label: value }));
}
