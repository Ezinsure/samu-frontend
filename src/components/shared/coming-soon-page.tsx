import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Deferred while COAP core ships"
        description="Community Opportunity workflows are the priority. Admin tooling (messaging, exports, users, settings, audit) returns after the programme modules are accepted."
      />
    </div>
  );
}
