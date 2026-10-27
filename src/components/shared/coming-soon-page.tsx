import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

interface ComingSoonPageProps {
  title: string;
  description: string;
  /** Why the page is unavailable (e.g. which API is still missing). */
  reason?: string;
}

/** Placeholder for modules whose backend API has not shipped yet. */
export function ComingSoonPage({
  title,
  description,
  reason = "This module is waiting for its backend API and will be enabled in a later release.",
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState title="Coming soon" description={reason} />
    </div>
  );
}
