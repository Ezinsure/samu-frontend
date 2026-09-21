"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const brandSwatches = [
  { name: "Navy 900", className: "bg-primary-900" },
  { name: "Navy 800", className: "bg-primary-800" },
  { name: "Blue 700", className: "bg-primary-700" },
  { name: "Blue 600", className: "bg-primary-600" },
  { name: "Soft 100", className: "bg-primary-100" },
  { name: "Soft 50", className: "bg-primary-50" },
] as const;

const statusItems = [
  {
    label: "Active / Compliant",
    icon: CheckCircle2,
    className: "bg-success-bg text-success border-success/20",
  },
  {
    label: "Attention / Due",
    icon: AlertTriangle,
    className: "bg-warning-bg text-warning border-warning/20",
  },
  {
    label: "Overdue / Critical",
    icon: XCircle,
    className: "bg-danger-bg text-danger border-danger/20",
  },
  {
    label: "Informational",
    icon: Info,
    className: "bg-info-bg text-info border-info/20",
  },
] as const;

export default function Phase0HomePage() {
  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-900 text-sm font-bold text-foreground-on-navy">
              S
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-foreground">
                SAMU
              </p>
              <p className="text-xs text-foreground-secondary">
                Solektra Agent Monitoring Utility
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-100 dark:text-primary-600">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            Phase 0 complete
          </div>
          <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]">
            Field operations, under control.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary sm:text-base">
            Foundation for the SAMU frontend demo: Next.js App Router, Inter,
            light/dark design tokens, toasts, and project structure. Product
            pages begin in Phase 1.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[15px] font-semibold text-foreground">
              Theme smoke test
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Toggle light and dark. Surfaces and status colors should remain
              intentional.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm text-foreground-muted">
                Preference is persisted by next-themes.
              </span>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-[15px] font-semibold text-foreground">
              Toast smoke test
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Sonner toasts are wired globally via AppProviders.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-primary-600 px-4 text-sm font-medium text-foreground-on-primary transition-colors hover:bg-primary-700"
                onClick={() =>
                  toast.success("Visit submitted", {
                    description: "Agent confirmation SMS queued.",
                  })
                }
              >
                Success toast
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-50"
                onClick={() =>
                  toast.error("Location required", {
                    description: "Enable GPS to continue the field visit.",
                  })
                }
              >
                Error toast
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-[15px] font-semibold text-foreground">
            Brand palette
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Navy for structure, blue for actions.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {brandSwatches.map((swatch) => (
              <div key={swatch.name} className="space-y-2">
                <div
                  className={`h-14 rounded-[var(--radius-md)] border border-border ${swatch.className}`}
                />
                <p className="text-xs font-medium text-foreground-secondary">
                  {swatch.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-[15px] font-semibold text-foreground">
            Status colors
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            Always pair color with a label or icon.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${item.className}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </span>
              );
            })}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-[15px] font-semibold text-foreground">
            Typography & metrics
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
              <p className="text-xs font-medium text-foreground-secondary">
                Total agents
              </p>
              <p className="mt-1 text-[32px] font-bold tabular-nums tracking-tight text-foreground">
                1,284
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
              <p className="text-xs font-medium text-foreground-secondary">
                Visit compliance
              </p>
              <p className="mt-1 text-[32px] font-bold tabular-nums tracking-tight text-success">
                92.4%
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
              <p className="text-xs font-medium text-foreground-secondary">
                Overdue agents
              </p>
              <p className="mt-1 text-[32px] font-bold tabular-nums tracking-tight text-danger">
                18
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-foreground-secondary">
            Body text uses Inter at 14px. Page titles use 28–32px / weight 700.
            Illustrative values only.
          </p>
        </section>

        <footer className="border-t border-border pt-4 text-xs text-foreground-muted">
          SAMU Phase 0 · Design tokens · Theme · Toasts · Folder scaffold
        </footer>
      </main>
    </div>
  );
}
