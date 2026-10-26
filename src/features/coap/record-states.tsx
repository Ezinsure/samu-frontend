import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";

/** Placeholder while a detail page loads. */
export function RecordSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}

/** Shown when a record is missing or outside the viewer's scope. */
export function RecordNotFound({
  title,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} />
      <Button asChild variant="secondary">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}

/** Shown on "new" pages for roles that cannot write (e.g. MD viewers). */
export function ReadOnlyNotice({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description="Read-only access." />
      <Button asChild variant="secondary">
        <Link href={backHref}>Back</Link>
      </Button>
    </div>
  );
}

/**
 * Standard loading / error / empty handling for a single-record detail page.
 * Renders `children(record)` once the record has loaded.
 */
export function RecordGate<T>({
  state,
  notFoundTitle,
  backHref,
  children,
}: {
  state: {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
  };
  notFoundTitle: string;
  backHref: string;
  children: (record: T) => React.ReactNode;
}) {
  if (state.error) {
    return (
      <ErrorState
        title="Could not load this record"
        description={state.error}
        onRetry={state.reload}
      />
    );
  }
  if (state.loading) return <RecordSkeleton />;
  if (!state.data) {
    return <RecordNotFound title={notFoundTitle} backHref={backHref} />;
  }
  return <>{children(state.data)}</>;
}
