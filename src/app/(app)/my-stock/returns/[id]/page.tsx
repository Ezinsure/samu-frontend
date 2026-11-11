"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { Skeleton } from "@/components/ui/skeleton";
import { ReturnApplicationView } from "@/features/inventory/return-application-view";
import {
  canUseMyStock,
  getStockTransfer,
  type StockTransfer,
} from "@/lib/api/stock";
import { useAuth } from "@/lib/auth/auth-context";

export default function MyStockReturnDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setTransfer(await getStockTransfer(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load return");
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (canUseMyStock(user)) void load();
  }, [user, load]);

  if (user && !canUseMyStock(user)) return <PermissionDenied />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Return application"
        description="Edit lines, confirm the current revision, and track activity with the office."
      />
      {error ? (
        <ErrorState
          title="Could not load return"
          description={error}
          onRetry={() => void load()}
        />
      ) : loading || !transfer || !user ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <ReturnApplicationView
          transfer={transfer}
          user={user}
          backHref="/my-stock/returns"
          onChanged={setTransfer}
        />
      )}
    </div>
  );
}
