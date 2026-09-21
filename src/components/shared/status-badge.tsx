import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  CircleDashed,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "inactive";

const toneConfig: Record<
  StatusTone,
  {
    variant: "success" | "warning" | "danger" | "info" | "secondary";
    icon: LucideIcon;
  }
> = {
  success: { variant: "success", icon: CheckCircle2 },
  warning: { variant: "warning", icon: AlertTriangle },
  danger: { variant: "danger", icon: XCircle },
  info: { variant: "info", icon: Info },
  neutral: { variant: "secondary", icon: CircleDashed },
  inactive: { variant: "secondary", icon: Ban },
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({
  label,
  tone = "neutral",
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {showIcon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
      <span>{label}</span>
    </Badge>
  );
}
