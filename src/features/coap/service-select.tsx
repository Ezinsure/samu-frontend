"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_LINES } from "@/lib/coap/catalog";
import type { ServiceLine } from "@/types";

interface ServiceSelectProps {
  value: ServiceLine | "all";
  onChange: (value: ServiceLine | "all") => void;
  allowAll?: boolean;
  id?: string;
}

export function ServiceSelect({
  value,
  onChange,
  allowAll = false,
  id,
}: ServiceSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ServiceLine | "all")}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Service line" />
      </SelectTrigger>
      <SelectContent>
        {allowAll ? <SelectItem value="all">All services</SelectItem> : null}
        {SERVICE_LINES.map((line) => (
          <SelectItem key={line.id} value={line.id}>
            {line.shortLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
