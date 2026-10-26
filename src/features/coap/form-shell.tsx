import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormShellProps {
  title: string;
  description: string;
  /** Heading of the form card. */
  cardTitle: string;
  /** Where "Cancel" returns to. */
  backHref: string;
  submitLabel: string;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  /** Two-column grid children (use `md:col-span-2` for full-width fields). */
  children: React.ReactNode;
}

/** Page header + single-card form layout used by every COAP "new" page. */
export function FormShell({
  title,
  description,
  cardTitle,
  backHref,
  submitLabel,
  saving,
  onSubmit,
  children,
}: FormShellProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="secondary">
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
