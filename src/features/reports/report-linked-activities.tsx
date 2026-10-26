import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyReportWorkspace } from "@/lib/api";

type Linked = MonthlyReportWorkspace["linkedActivities"];

const LINK_CLASS =
  "block text-primary-700 hover:underline dark:text-primary-300";

/** Card listing linked records; `rows` are already formatted links. */
function LinkedCard({
  title,
  count,
  rows,
  className,
}: {
  title: string;
  count: number;
  rows: Array<{ id: string; href: string; label: string }>;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {title} ({count})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.length === 0 ? (
          <p className="text-foreground-secondary">None this period.</p>
        ) : (
          rows.map((row) => (
            <Link key={row.id} href={row.href} className={LINK_CLASS}>
              {row.label}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** Records for the report period that feed the KPI numbers. */
export function ReportLinkedActivities({ linked }: { linked: Linked }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Visits in period ({linked.visits})</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" size="sm">
            <Link href="/visits">Open visits</Link>
          </Button>
        </CardContent>
      </Card>

      <LinkedCard
        title="Sensitization"
        count={linked.sensitizations.length}
        rows={linked.sensitizations.map((item) => ({
          id: item.id,
          href: `/sensitization/${item.id}`,
          label: `${item.date} · ${item.venue} · ${item.peopleReached} reached`,
        }))}
      />
      <LinkedCard
        title="Training"
        count={linked.trainings.length}
        rows={linked.trainings.map((item) => ({
          id: item.id,
          href: `/training/${item.id}`,
          label: `${item.date} · ${item.topic} · ${item.agentsTrained} agents`,
        }))}
      />
      <LinkedCard
        title="Meetings"
        count={linked.meetings.length}
        rows={linked.meetings.map((item) => ({
          id: item.id,
          href: `/meetings/${item.id}`,
          label: `${item.date} · ${item.meetingType} · ${item.location}`,
        }))}
      />

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Open action items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {linked.actionItems.length === 0 ? (
            <p className="text-foreground-secondary">No linked actions.</p>
          ) : (
            linked.actionItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"
              >
                <span>{item.title}</span>
                <span className="text-xs text-foreground-secondary">
                  {item.status} · due {item.dueDate}
                </span>
              </div>
            ))
          )}
          <Button asChild variant="secondary" size="sm">
            <Link href="/action-items">Open action board</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
