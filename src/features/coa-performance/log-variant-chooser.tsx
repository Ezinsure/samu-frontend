"use client";

import { Building2, Home, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CoaMetric, CoaMetricVariant } from "@/lib/api/coa-metrics";

const VARIANT_ICONS: Record<string, typeof Smartphone> = {
  sim: Smartphone,
  hbb: Home,
  obb: Building2,
};

interface LogVariantChooserProps {
  metric: CoaMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (variant: CoaMetricVariant) => void;
}

/** First step when a metric has multiple logging variants (e.g. SIM / HBB / OBB). */
export function LogVariantChooser({
  metric,
  open,
  onOpenChange,
  onSelect,
}: LogVariantChooserProps) {
  const variants = metric?.variants ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose internet type</DialogTitle>
          <DialogDescription>
            {metric?.label ?? "Internet subscriptions"} — pick how this
            activation was done.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-1">
          {variants.map((variant) => {
            const Icon = VARIANT_ICONS[variant.key] ?? Smartphone;
            return (
              <button
                key={variant.key}
                type="button"
                onClick={() => onSelect(variant)}
                className="group flex w-full items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-4 text-left transition hover:border-primary-600 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-900 text-foreground-on-navy transition group-hover:bg-primary-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {variant.label}
                  </span>
                  {variant.description ? (
                    <span className="mt-1 block text-xs leading-relaxed text-foreground-secondary">
                      {variant.description}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
