"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  stockMovementLabel,
  transferStatusLabel,
  transferStatusTone,
  type StockUnitDetail,
} from "@/lib/api/stock";

function decisionLabel(decision: string) {
  switch (decision) {
    case "accepted":
      return "Accepted";
    case "missing":
      return "Missing";
    case "wrong":
      return "Wrong item";
    case "declined":
      return "Declined";
    case "pending":
      return "Pending";
    default:
      return decision;
  }
}

function decisionTone(
  decision: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (decision) {
    case "accepted":
      return "success";
    case "missing":
    case "wrong":
      return "warning";
    case "declined":
      return "danger";
    case "pending":
      return "info";
    default:
      return "neutral";
  }
}

export function UnitHistoryPanels({
  unit,
  role = "admin",
}: {
  unit: StockUnitDetail;
  role?: "admin" | "holder";
}) {
  function transferHref(row: NonNullable<StockUnitDetail["transferHistory"]>[number]) {
    if (role === "admin") {
      return row.transfer.kind === "return"
        ? `/inventory/returns/${row.transfer.id}`
        : `/inventory/assignments/${row.transfer.id}`;
    }
    return row.transfer.kind === "return"
      ? `/my-stock/returns/${row.transfer.id}`
      : `/my-stock/incoming/${row.transfer.id}`;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment history</CardTitle>
        </CardHeader>
        <CardContent>
          {!unit.transferHistory?.length ? (
            <p className="text-sm text-muted-foreground">
              No assignment or return applications for this serial yet.
            </p>
          ) : (
            <div className="space-y-3">
              {unit.transferHistory.map((row) => (
                <div
                  key={row.itemId}
                  className="space-y-2 rounded-md border border-border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium capitalize">
                        {row.transfer.kind} ·{" "}
                        {row.transfer.toUser?.name ??
                          row.transfer.fromUser?.name ??
                          "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.transfer.createdAt).toLocaleString()}
                        {row.transfer.createdBy
                          ? ` · by ${row.transfer.createdBy.name}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge
                        label={transferStatusLabel(row.transfer.status)}
                        tone={transferStatusTone(row.transfer.status)}
                      />
                      <StatusBadge
                        label={decisionLabel(row.decision)}
                        tone={decisionTone(row.decision)}
                      />
                    </div>
                  </div>
                  {row.decisionNote ? (
                    <p className="text-xs text-muted-foreground">
                      Decision note: {row.decisionNote}
                    </p>
                  ) : null}
                  {row.transfer.events.length > 0 ? (
                    <ul className="space-y-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                      {row.transfer.events.map((event) => (
                        <li key={event.id}>
                          {new Date(event.createdAt).toLocaleString()} ·{" "}
                          <span className="text-foreground">{event.type}</span>
                          {event.actor ? ` · ${event.actor.name}` : ""}
                          {event.note ? ` — ${event.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Link
                    href={transferHref(row)}
                    className="text-xs font-medium text-primary-600 hover:underline"
                  >
                    Open transfer
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {unit.movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No movements recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">When</th>
                    <th className="pb-2 pr-3 font-medium">Event</th>
                    <th className="pb-2 pr-3 font-medium">From → To</th>
                    <th className="pb-2 pr-3 font-medium">Actor</th>
                    <th className="pb-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {unit.movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-t border-border/70"
                    >
                      <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-3">
                        {stockMovementLabel(movement.type)}
                        {movement.reasonCode ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {movement.reasonCode.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {movement.fromHolder?.name ?? "Warehouse"} →{" "}
                        {movement.toHolder?.name ?? "Warehouse"}
                      </td>
                      <td className="py-2.5 pr-3">{movement.actor.name}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {movement.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
