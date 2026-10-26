import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPI_LABELS } from "@/lib/api";

interface ReportKpiTableProps {
  actuals: Record<string, number>;
  targets: Record<string, number>;
}

/** KPI actuals against the configured monthly targets. */
export function ReportKpiTable({ actuals, targets }: ReportKpiTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI actuals vs targets</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-secondary">
              <th className="px-4 py-3 font-medium">KPI</th>
              <th className="px-4 py-3 font-medium">Actual</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(targets).map((key) => {
              const actual = actuals[key] ?? 0;
              const target = targets[key] ?? 0;
              const met = actual >= target;
              return (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{KPI_LABELS[key] ?? key}</td>
                  <td className="px-4 py-3 font-medium tabular-nums">{actual}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground-secondary">
                    {target}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={met ? "Met" : "Below"}
                      tone={met ? "success" : "warning"}
                      showIcon={false}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
