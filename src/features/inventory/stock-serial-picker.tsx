"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/shared/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAvailableStockUnits,
  type AvailableStockUnit,
} from "@/lib/api/stock";

interface StockSerialPickerProps {
  label: string;
  typeKey: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  /** Exclude already-selected unit ids from other pickers on the same form. */
  excludeIds?: string[];
  holderUserId?: string;
  onChange: (unit: AvailableStockUnit | null) => void;
}

export function StockSerialPicker({
  label,
  typeKey,
  value,
  required,
  disabled,
  excludeIds = [],
  holderUserId,
  onChange,
}: StockSerialPickerProps) {
  const [units, setUnits] = useState<AvailableStockUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getAvailableStockUnits({
      typeKey,
      pageSize: 100,
      holderUserId,
    })
      .then((page) => {
        if (cancelled) return;
        setUnits(page.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load stock");
        setUnits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typeKey, holderUserId]);

  const options = units.filter(
    (unit) => unit.id === value || !excludeIds.includes(unit.id),
  );

  return (
    <FormField label={label} required={required}>
      <Select
        value={value ?? ""}
        onValueChange={(next) => {
          if (!next) {
            onChange(null);
            return;
          }
          const unit = options.find((row) => row.id === next) ?? null;
          onChange(unit);
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              loading
                ? "Loading stock…"
                : options.length === 0
                  ? "No units in hand"
                  : "Select serial"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              <span className="font-mono">{unit.serial}</span>
              {unit.status === "returned_by_customer" ? " · returned" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-[var(--samu-danger)]">{error}</p>
      ) : options.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">
          Accept an assignment first, or ask Admin to assign more{" "}
          {typeKey.replaceAll("_", " ")} units.
        </p>
      ) : null}
    </FormField>
  );
}
