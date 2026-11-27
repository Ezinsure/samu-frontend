"use client";

import Link from "next/link";
import type { DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  formatStockTypeLabel,
  formatUnitAttributes,
  stockStatusLabel,
  stockStatusTone,
  type StockUnit,
} from "@/lib/api/stock";

export function buildUnitColumns(opts?: {
  detailBasePath?: string;
}): DataTableColumn<StockUnit>[] {
  const base = opts?.detailBasePath ?? "/inventory";
  return [
    {
      id: "serial",
      header: "Serial",
      cell: (row) => (
        <Link
          href={`${base}/${row.id}`}
          className="font-mono text-sm font-medium text-foreground hover:underline"
        >
          {row.serial}
        </Link>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (row) => {
        const category =
          typeof row.attributes?.category === "string"
            ? row.attributes.category.trim()
            : "";
        const detail = formatUnitAttributes(row.attributes);
        return (
          <span className="text-sm text-foreground">
            {formatStockTypeLabel(row.type.label, row.attributes)}
            {!category && detail ? (
              <span className="block text-xs text-muted-foreground">{detail}</span>
            ) : null}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={stockStatusLabel(row.status)}
          tone={stockStatusTone(row.status)}
        />
      ),
    },
    {
      id: "holder",
      header: "Holder",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.holder?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "condition",
      header: "Condition",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.condition ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-[1%] whitespace-nowrap text-right",
      cell: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`${base}/${row.id}`}>Open</Link>
        </Button>
      ),
    },
  ];
}
