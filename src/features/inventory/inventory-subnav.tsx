"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS: Array<{ href: string; label: string; match: "exact" | "prefix" }> =
  [
    { href: "/inventory", label: "Stock", match: "exact" },
    { href: "/inventory/assignments", label: "Assignments", match: "prefix" },
    { href: "/inventory/returns", label: "Returns", match: "prefix" },
    { href: "/inventory/faulty", label: "Faulty queue", match: "prefix" },
    { href: "/inventory/reports", label: "Reports", match: "prefix" },
  ];

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared workflow nav for all admin inventory pages. */
export function InventorySubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Inventory sections"
      className="flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-muted/30 p-1"
    >
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.match);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-surface text-foreground shadow-[var(--samu-shadow-card)]"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
