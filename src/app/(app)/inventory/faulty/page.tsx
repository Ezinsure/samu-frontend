"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canManageStock,
  disposeFaultyUnits,
  getFaultyQueue,
  getStockTypes,
  stockStatusLabel,
  stockStatusTone,
  type StockItemType,
  type StockUnit,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";

const PAGE_SIZE = 20;

export default function InventoryFaultyPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState<StockItemType[]>([]);
  const [rows, setRows] = useState<StockUnit[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [disposeAction, setDisposeAction] = useState<
    "return_to_supplier" | "deactivate" | null
  >(null);
  const [note, setNote] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [busy, setBusy] = useState(false);

  const { filters, applied, setFilters, setPage } = useListFilters({
    search: "",
    typeKey: "all",
  });

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "All types" },
      ...types
        .filter((t) => t.enabled)
        .map((t) => ({ value: t.key, label: t.label })),
    ],
    [types],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeKey = filterValue(applied.typeKey);
      const [typeRows, page] = await Promise.all([
        getStockTypes({ includeDisabled: true }),
        getFaultyQueue({
          page: applied.page,
          pageSize: PAGE_SIZE,
          search: applied.search || undefined,
          typeKey,
        }),
      ]);
      setTypes(typeRows);
      setRows(page.data);
      setTotal(page.total);
      setTotalPages(page.totalPages);
      setSelected(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load faulty queue",
      );
    } finally {
      setLoading(false);
    }
  }, [applied.page, applied.search, applied.typeKey]);

  useEffect(() => {
    if (canManageStock(user)) void load();
  }, [user, load]);

  if (user && !canManageStock(user)) return <PermissionDenied />;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.id)));
  }

  async function handleDispose() {
    if (!disposeAction || selected.size === 0) return;
    setBusy(true);
    const result = await disposeFaultyUnits({
      unitIds: [...selected],
      action: disposeAction,
      note: note.trim() || undefined,
      supplierRef:
        disposeAction === "return_to_supplier"
          ? supplierRef.trim() || undefined
          : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not update faulty units", {
        description: result.error,
      });
      return;
    }
    toast.success(
      disposeAction === "return_to_supplier"
        ? `Returned ${result.data.disposed} unit(s) to supplier`
        : `Deactivated ${result.data.disposed} unit(s)`,
    );
    setDisposeAction(null);
    setNote("");
    setSupplierRef("");
    void load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faulty queue"
        description="Devices confirmed faulty (including technical returns). Select units to return to supplier or deactivate."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/inventory">Inventory</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/inventory/returns">Returns</Link>
            </Button>
          </>
        }
      />

      <FilterBar
        searchPlaceholder="Search serial, notes…"
        searchValue={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        filters={
          <FilterSelect
            value={filters.typeKey}
            onChange={(typeKey) => setFilters({ typeKey })}
            placeholder="Type"
            allLabel="All types"
            options={typeOptions.filter((o) => o.value !== "all")}
            widthClass="w-[210px]"
          />
        }
      />

      {error ? (
        <ErrorState
          title="Could not load faulty queue"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total} unit{total === 1 ? "" : "s"} in queue
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={selected.size === 0 || busy}
                onClick={() => setDisposeAction("return_to_supplier")}
              >
                Return to supplier
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={selected.size === 0 || busy}
                onClick={() => setDisposeAction("deactivate")}
              >
                Deactivate
              </Button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-md border border-border p-6 text-sm text-muted-foreground">
              Queue is empty. Technical returns with reason “Faulty” enter
              automatically after dual confirmation, or confirm units from a
              warehouse device page.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={
                          rows.length > 0 && selected.size === rows.length
                        }
                        onChange={toggleAll}
                        aria-label="Select all on page"
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">Serial</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Condition</th>
                    <th className="px-3 py-2 font-medium">Batch</th>
                    <th className="px-3 py-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border/70">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggle(row.id)}
                          aria-label={`Select ${row.serial}`}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono">
                        <Link
                          href={`/inventory/${row.id}`}
                          className="hover:underline"
                        >
                          {row.serial}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{row.type.label}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={stockStatusLabel(row.status)}
                          tone={stockStatusTone(row.status)}
                          showIcon={false}
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.condition ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.intakeBatch?.label ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(row.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={applied.page <= 1}
                onClick={() => setPage(applied.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {applied.page} of {totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={applied.page >= totalPages}
                onClick={() => setPage(applied.page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={Boolean(disposeAction)}
        onOpenChange={(open) => {
          if (!open) {
            setDisposeAction(null);
            setNote("");
            setSupplierRef("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {disposeAction === "return_to_supplier"
                ? "Return to supplier"
                : "Deactivate units"}
            </DialogTitle>
            <DialogDescription>
              {selected.size} selected unit
              {selected.size === 1 ? "" : "s"} will leave the faulty queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {disposeAction === "return_to_supplier" ? (
              <FormField label="Supplier / RMA ref" htmlFor="faulty-supplier">
                <Input
                  id="faulty-supplier"
                  value={supplierRef}
                  onChange={(e) => setSupplierRef(e.target.value)}
                  placeholder="Optional"
                />
              </FormField>
            ) : null}
            <FormField label="Note" htmlFor="faulty-note">
              <Textarea
                id="faulty-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional disposition note"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDisposeAction(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                disposeAction === "deactivate" ? "destructive" : "default"
              }
              disabled={busy}
              onClick={() => void handleDispose()}
            >
              {busy
                ? "Saving…"
                : disposeAction === "return_to_supplier"
                  ? "Confirm return"
                  : "Confirm deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
