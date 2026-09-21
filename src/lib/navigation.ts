import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  MapPinned,
  ClipboardCheck,
  Megaphone,
  GraduationCap,
  CalendarCheck,
  ListTodo,
  FileBarChart,
  Award,
  Map,
  LineChart,
  MessageSquare,
  Download,
  Shield,
  AlertTriangle,
  Settings,
  ScrollText,
  Palette,
} from "lucide-react";
import type { AppRole } from "@/types";

export type { AppRole };

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. Empty = all authenticated (except AGENT stub). */
  roles?: AppRole[];
}

export const MAIN_NAV: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Agents",
    href: "/agents",
    icon: Users,
  },
  {
    title: "Territories",
    href: "/territories",
    icon: MapPinned,
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
  {
    title: "Field visits",
    href: "/visits",
    icon: ClipboardCheck,
  },
  {
    title: "Sensitization",
    href: "/sensitization",
    icon: Megaphone,
  },
  {
    title: "Training",
    href: "/training",
    icon: GraduationCap,
  },
  {
    title: "Meetings",
    href: "/meetings",
    icon: CalendarCheck,
  },
  {
    title: "Action items",
    href: "/action-items",
    icon: ListTodo,
  },
  {
    title: "Monthly reports",
    href: "/monthly-reports",
    icon: FileBarChart,
  },
  {
    title: "Scorecards",
    href: "/scorecards",
    icon: Award,
  },
  {
    title: "Maps",
    href: "/maps",
    icon: Map,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
  {
    title: "Messaging",
    href: "/messaging",
    icon: MessageSquare,
    roles: ["ADMIN", "OPERATIONS_MANAGER"],
  },
  {
    title: "Reports & exports",
    href: "/reports",
    icon: Download,
  },
  {
    title: "Users & access",
    href: "/users",
    icon: Shield,
    roles: ["ADMIN"],
  },
  {
    title: "Fraud review",
    href: "/fraud",
    icon: AlertTriangle,
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    title: "Audit logs",
    href: "/audit",
    icon: ScrollText,
    roles: ["ADMIN", "OPERATIONS_MANAGER"],
  },
  {
    title: "Design system",
    href: "/design-system",
    icon: Palette,
    roles: ["ADMIN"],
  },
];

export function getNavForRole(role: AppRole): NavItem[] {
  if (role === "AGENT") {
    return [
      {
        title: "Agent portal",
        href: "/agent",
        icon: Users,
      },
    ];
  }

  return MAIN_NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}
