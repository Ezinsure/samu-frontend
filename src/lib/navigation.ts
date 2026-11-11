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
  Link2,
  HeadphonesIcon,
  SlidersHorizontal,
  Package,
  PackageCheck,
} from "lucide-react";
import type { AppRole } from "@/types";

export type { AppRole };

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. Empty = all authenticated (except AGENT stub). */
  roles?: AppRole[];
  /** When true, shown but not navigable (phase not ready). */
  locked?: boolean;
  /**
   * When set with `locked`, only these roles see the lock.
   * Omit to lock for every role that can see the item.
   */
  lockedForRoles?: AppRole[];
  lockedReason?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const LAUNCH_LOCK = "Opening after COA launch — contact admin if needed";

function effectiveNavRole(role: AppRole): AppRole {
  return role === "OPERATIONS_MANAGER" || role === "MD_VIEWER" ? "ADMIN" : role;
}

/** Whether a nav item is locked for the given viewer role. */
export function isNavItemLocked(item: NavItem, role: AppRole): boolean {
  if (!item.locked) return false;
  if (!item.lockedForRoles?.length) return true;
  return item.lockedForRoles.includes(effectiveNavRole(role));
}

const HOME: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const MY_WORK: NavItem[] = [
  {
    title: "Leads",
    href: "/leads",
    icon: UserPlus,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Activities",
    href: "/activities",
    icon: ClipboardList,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Performance",
    href: "/performance",
    icon: ClipboardList,
    roles: ["COMMUNITY_OPPORTUNITY_ASSOCIATE", "ADMIN"],
  },
  {
    title: "My stock",
    href: "/my-stock",
    icon: PackageCheck,
    roles: [
      "COMMUNITY_OPPORTUNITY_ASSOCIATE",
      "TERRITORY_COORDINATOR",
      "ADMIN",
    ],
  },
  {
    title: "Onboarding",
    href: "/onboarding",
    icon: Handshake,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: ShoppingBag,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
  },
  {
    title: "Feedback",
    href: "/feedback",
    icon: MessageCircleHeart,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
];

const SERVICES: NavItem[] = [
  {
    title: "Services",
    href: "/services",
    icon: Layers,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
];

const NETWORK: NavItem[] = [
  {
    title: "Agent network",
    href: "/agents",
    icon: Users,
    roles: ["ADMIN", "TERRITORY_COORDINATOR", "COMMUNITY_OPPORTUNITY_ASSOCIATE"],
  },
  {
    title: "Invite links",
    href: "/invite-links",
    icon: Link2,
    roles: ["ADMIN", "TERRITORY_COORDINATOR", "COMMUNITY_OPPORTUNITY_ASSOCIATE"],
  },
  {
    title: "Territories",
    href: "/territories",
    icon: MapPinned,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Field visits",
    href: "/visits",
    icon: ClipboardCheck,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Support log",
    href: "/support",
    icon: HeadphonesIcon,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Fraud review",
    href: "/fraud",
    icon: AlertTriangle,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: LAUNCH_LOCK,
  },
];

const LEGACY_FIELD: NavItem[] = [
  {
    title: "Sensitization",
    href: "/sensitization",
    icon: Megaphone,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedReason: "Not available yet",
  },
  {
    title: "Training",
    href: "/training",
    icon: GraduationCap,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Meetings",
    href: "/meetings",
    icon: CalendarCheck,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedReason: "Not available yet",
  },
  {
    title: "Action items",
    href: "/action-items",
    icon: ListTodo,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedReason: "Not available yet",
  },
];

const INSIGHTS: NavItem[] = [
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "COA performance",
    href: "/coa-performance",
    icon: FileBarChart,
    roles: ["ADMIN"],
  },
  {
    title: "COA metrics",
    href: "/coa-metrics",
    icon: SlidersHorizontal,
    roles: ["ADMIN"],
  },
  {
    title: "Visit coverage",
    href: "/visit-coverage",
    icon: ClipboardCheck,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Maps",
    href: "/maps",
    icon: Map,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Monthly reports",
    href: "/monthly-reports",
    icon: FileBarChart,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Scorecards",
    href: "/scorecards",
    icon: Award,
    roles: ["ADMIN", "TERRITORY_COORDINATOR"],
    locked: true,
    lockedForRoles: ["ADMIN"],
    lockedReason: LAUNCH_LOCK,
  },
];

const ADMIN: NavItem[] = [
  {
    title: "Messaging",
    href: "/messaging",
    icon: MessageSquare,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Reports & exports",
    href: "/reports",
    icon: Download,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: "Export catalog unlocks with COA performance",
  },
  {
    title: "Devices & stock",
    href: "/inventory",
    icon: Package,
    roles: ["ADMIN"],
  },
  {
    title: "Stock returns",
    href: "/inventory/returns",
    icon: PackageCheck,
    roles: ["ADMIN"],
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
    locked: true,
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Audit logs",
    href: "/audit",
    icon: ScrollText,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: LAUNCH_LOCK,
  },
  {
    title: "Design system",
    href: "/design-system",
    icon: Palette,
    roles: ["ADMIN"],
    locked: true,
    lockedReason: LAUNCH_LOCK,
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
            locked: true,
            lockedReason: "Agent portal is not enabled yet",
          },
        ],
      },
    ];
  }

  const effectiveRole = effectiveNavRole(role);

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: filterItems(group.items, effectiveRole),
  })).filter((group) => group.items.length > 0);
}

export function getNavForRole(role: AppRole): NavItem[] {
  return getNavGroupsForRole(role).flatMap((group) => group.items);
}

export function findNavItem(pathname: string): NavItem | undefined {
  return MAIN_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
