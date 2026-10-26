"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { defaultDashboardFilters, type DashboardFilters } from "@/lib/api";

interface DashboardFiltersBarProps {
  value: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  provinces: string[];
  districts: string[];
  coordinators: Array<{ id: string; name: string }>;
  showTcFilter?: boolean;
}

export function DashboardFiltersBar({
  value,
  onChange,
  provinces,
  districts,
  coordinators,
  showTcFilter = true,
}: DashboardFiltersBarProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--samu-shadow-card)]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="date-from">From</Label>
          <Input
            id="date-from"
            type="date"
            value={value.dateFrom ?? ""}
            onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date-to">To</Label>
          <Input
            id="date-to"
            type="date"
            value={value.dateTo ?? ""}
            onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Province</Label>
          <Select
            value={value.province ?? "all"}
            onValueChange={(province) =>
              onChange({
                ...value,
                province: province === "all" ? undefined : province,
                district: undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All provinces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All provinces</SelectItem>
              {provinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>District</Label>
          <Select
            value={value.district ?? "all"}
            onValueChange={(district) =>
              onChange({
                ...value,
                district: district === "all" ? undefined : district,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showTcFilter ? (
          <div className="space-y-1.5">
            <Label>Territory coordinator</Label>
            <Select
              value={value.tcUserId ?? "all"}
              onValueChange={(tcUserId) =>
                onChange({
                  ...value,
                  tcUserId: tcUserId === "all" ? undefined : tcUserId,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All coordinators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All coordinators</SelectItem>
                {coordinators.map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    {tc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange(defaultDashboardFilters())}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}
