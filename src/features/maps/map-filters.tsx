"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { MapFilters } from "@/lib/api";

interface MapFiltersBarProps {
  value: MapFilters;
  onChange: (next: MapFilters) => void;
  provinces: string[];
  districts: string[];
  coordinators: Array<{ id: string; name: string }>;
  showTcFilter?: boolean;
}

export function MapFiltersBar({
  value,
  onChange,
  provinces,
  districts,
  coordinators,
  showTcFilter = true,
}: MapFiltersBarProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--samu-shadow-card)]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
        <div className="space-y-1.5">
          <Label>Compliance</Label>
          <Select
            value={value.compliance ?? "all"}
            onValueChange={(compliance) =>
              onChange({
                ...value,
                compliance:
                  compliance === "all"
                    ? undefined
                    : (compliance as MapFilters["compliance"]),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All compliance</SelectItem>
              <SelectItem value="green">Compliant</SelectItem>
              <SelectItem value="yellow">Due soon</SelectItem>
              <SelectItem value="red">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Agent status</Label>
          <Select
            value={value.status ?? "all"}
            onValueChange={(status) =>
              onChange({
                ...value,
                status:
                  status === "all"
                    ? undefined
                    : (status as MapFilters["status"]),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Pending verification">
                Pending verification
              </SelectItem>
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
          onClick={() => onChange({})}
        >
          Reset filters
        </Button>
      </div>
    </div>
  );
}
