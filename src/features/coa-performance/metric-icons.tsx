import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  Flame,
  Globe2,
  Shield,
  Smartphone,
  Sun,
  UserPlus,
  Wifi,
  Droplets,
} from "lucide-react";

const BY_KEY: Record<string, LucideIcon> = {
  bk_accounts: Building2,
  irembo_agents_applied: UserPlus,
  ezinsure_policies: Shield,
  ezinsure_agents_applied: ClipboardList,
  internet_subscriptions: Wifi,
  internet_agents_applied: Globe2,
  smartphone_installments: Smartphone,
  induction_cooker_installments: Flame,
  solar_home_systems: Sun,
  solar_water_heaters: Droplets,
};

export function iconForMetricKey(key: string): LucideIcon {
  return BY_KEY[key] ?? ClipboardList;
}
