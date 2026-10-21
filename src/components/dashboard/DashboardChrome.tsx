"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart2,
  ClipboardCheck,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";

type Role = "admin" | "partner" | "board";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAVIGATION: Record<Role, NavGroup[]> = {
  admin: [
    {
      label: null,
      items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    {
      label: "Store",
      items: [
        { href: "/dashboard/products", label: "Products", icon: Package },
        {
          href: "/dashboard/products/approval",
          label: "Approval queue",
          icon: ClipboardCheck,
        },
        { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/dashboard/team", label: "Team", icon: Users },
        { href: "/dashboard/shipping", label: "Shipping", icon: Truck },
        { href: "/dashboard/commission", label: "Commission", icon: BarChart2 },
        { href: "/dashboard/updates", label: "Updates", icon: Megaphone },
      ],
    },
    {
      label: "Account",
      items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
    },
  ],
  partner: [
    {
      label: null,
      items: [
        { href: "/dashboard/products", label: "My products", icon: Package },
        { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
      ],
    },
  ],
  board: [
    {
      label: null,
      items: [
        { href: "/dashboard", label: "Upcoming", icon: Package },
        { href: "/dashboard/updates", label: "Updates", icon: Megaphone },
      ],
    },
  ],
};

function activeHref(pathname: string, items: NavItem[]): string | null {
  const matches = items
    .filter(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
    )
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? null;
}

function NavLinks({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const allItems = groups.flatMap((group) => group.items);
  const active = activeHref(pathname, allItems);

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Dashboard">
      {groups.map((group, index) => (
        <div key={group.label ?? `group-${index}`}>
          {group.label && (
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = item.href === active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-l-2 px-2.5 py-2.5 text-[13px] font-medium transition-colors",
                      isActive
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-transparent text-muted hover:bg-charcoal hover:text-offwhite"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DashboardChrome({
  role,
  fullName,
  children,
}: {
  role: Role;
  fullName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = NAVIGATION[role];

  return (
    <div className="theme-admin flex min-h-screen bg-jet text-offwhite">
      {/* Desktop sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link
            href="/dashboard"
            className="font-oswald text-xl font-semibold uppercase leading-none tracking-[0.12em] text-offwhite"
          >
            Creamice<span className="text-gold">.</span>
          </Link>
          <span className="ml-2 rounded-md bg-charcoal px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
            {role}
          </span>
        </div>

        <NavLinks groups={groups} pathname={pathname} />

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-xs font-semibold uppercase text-gold">
              {fullName.slice(0, 1) || "C"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-offwhite">{fullName}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted">{role}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-charcoal hover:text-offwhite"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open dashboard menu"
              aria-expanded={menuOpen}
              className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-offwhite transition-colors hover:bg-charcoal lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/dashboard"
              className="font-oswald text-lg font-semibold uppercase leading-none tracking-[0.12em] text-offwhite lg:hidden"
            >
              Creamice<span className="text-gold">.</span>
            </Link>
            <p className="hidden text-sm font-medium text-offwhite lg:block">
              Dashboard
            </p>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-offwhite"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">View store</span>
            </Link>
            <span className="hidden items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {fullName}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Dashboard">
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-charcoal px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold uppercase text-gold">
              {fullName.slice(0, 1) || "C"}
            </span>
            <div>
              <p className="text-xs font-medium text-offwhite">{fullName}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted">{role}</p>
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-offwhite"
          >
            Store
          </Link>
        </div>

        <NavLinks
          groups={groups}
          pathname={pathname}
          onNavigate={() => setMenuOpen(false)}
        />

        <form action="/api/auth/logout" method="POST" className="mt-4 border-t border-border pt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-charcoal hover:text-offwhite"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </Drawer>
    </div>
  );
}
