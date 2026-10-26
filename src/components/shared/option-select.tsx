import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterOption } from "@/components/shared/filter-select";

interface OptionSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  id?: string;
  placeholder?: string;
}

/** Plain single-select for forms (no "All" entry — see `FilterSelect` for filters). */
export function OptionSelect({
  value,
  onChange,
  options,
  id,
  placeholder,
}: OptionSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
