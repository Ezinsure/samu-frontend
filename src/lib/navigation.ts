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
  UserPlus,
  Handshake,
  ShoppingBag,
  MessageCircleHeart,
  Layers,
  ClipboardList,
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

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const HOME: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const MY_WORK: NavItem[] = [
  { title: "Leads", href: "/leads", icon: UserPlus },
  { title: "Activities", href: "/activities", icon: ClipboardList },
  { title: "Onboarding", href: "/onboarding", icon: Handshake },
  { title: "Sales", href: "/sales", icon: ShoppingBag },
  { title: "Feedback", href: "/feedback", icon: MessageCircleHeart },
];

const SERVICES: NavItem[] = [
  { title: "Services", href: "/services", icon: Layers },
];

const NETWORK: NavItem[] = [
  { title: "Agents", href: "/agents", icon: Users },
  {
    title: "Territories",
    href: "/territories",
    icon: MapPinned,
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
  { title: "Field visits", href: "/visits", icon: ClipboardCheck },
  {
    title: "Fraud review",
    href: "/fraud",
    icon: AlertTriangle,
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
];

const LEGACY_FIELD: NavItem[] = [
  { title: "Sensitization", href: "/sensitization", icon: Megaphone },
  { title: "Training", href: "/training", icon: GraduationCap },
  { title: "Meetings", href: "/meetings", icon: CalendarCheck },
  { title: "Action items", href: "/action-items", icon: ListTodo },
];

const INSIGHTS: NavItem[] = [
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
  { title: "Maps", href: "/maps", icon: Map },
  { title: "Monthly reports", href: "/monthly-reports", icon: FileBarChart },
  { title: "Scorecards", href: "/scorecards", icon: Award },
];

/** Admin tools — demoted; Coming Soon until after COAP core */
const ADMIN: NavItem[] = [
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
    roles: ["ADMIN", "OPERATIONS_MANAGER", "MD_VIEWER"],
  },
  {
    title: "Users & access",
    href: "/users",
    icon: Shield,
    roles: ["ADMIN"],
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

export const NAV_GROUPS: NavGroup[] = [
  { id: "home", label: "Home", items: HOME },
  { id: "work", label: "My work", items: MY_WORK },
  { id: "services", label: "Services", items: SERVICES },
  { id: "network", label: "Network", items: NETWORK },
  { id: "field", label: "Field archive", items: LEGACY_FIELD },
  { id: "insights", label: "Insights", items: INSIGHTS },
  { id: "admin", label: "Admin", items: ADMIN },
];

/** Flat list for access checks / legacy callers */
export const MAIN_NAV: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

function filterItems(items: NavItem[], role: AppRole): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

export function getNavGroupsForRole(role: AppRole): NavGroup[] {
  if (role === "AGENT") {
    return [
      {
        id: "agent",
        label: "Portal",
        items: [
          {
            title: "Agent portal",
            href: "/agent",
            icon: Users,
          },
        ],
      },
    ];
  }

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: filterItems(group.items, role),
  })).filter((group) => group.items.length > 0);
}

export function getNavForRole(role: AppRole): NavItem[] {
  return getNavGroupsForRole(role).flatMap((group) => group.items);
}
