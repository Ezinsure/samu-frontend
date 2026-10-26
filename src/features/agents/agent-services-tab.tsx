import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentServices } from "@/types";

function ServiceRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <StatusBadge label={ok ? "Ready" : "Missing"} tone={ok ? "success" : "danger"} />
    </div>
  );
}

/** Readiness checklist (tools, devices, connectivity, training). */
export function AgentServicesTab({ services }: { services: AgentServices }) {
  const rows: Array<[label: string, ok: boolean]> = [
    ["IREMBO tools", services.iremboTools],
    ["Insurance tools", services.insuranceTools],
    ["Telecom / internet tools", services.telecomTools],
    ["BK / financial inclusion", services.bkTools],
    ["Smartphone", services.smartphone],
    ["Printer", services.printer],
    ["Internet available", services.internetAvailable],
    ["Starlink-ready", Boolean(services.starlinkReady)],
    ["Clean cooking tools", Boolean(services.cleanCookingTools)],
    ["Branding visible", services.brandingVisible],
    ["Trained on COAP services", services.trainedOnServices],
    ["Actively selling", services.activelySelling],
  ];

  return (
    <>
      {rows.map(([label, ok]) => (
        <ServiceRow key={label} label={label} ok={ok} />
      ))}
      <Card className="sm:col-span-2">
        <CardContent className="pt-5 text-sm">
          Internet type:{" "}
          <span className="font-medium">
            {services.internetAvailable
              ? (services.internetType ?? "Unknown")
              : "Not available"}
          </span>
        </CardContent>
      </Card>
    </>
  );
}
