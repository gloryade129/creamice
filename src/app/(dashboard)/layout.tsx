import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  ShoppingBag,
  FileText,
  BarChart2,
  LogOut,
} from "lucide-react";

export const dynamic = "force-dynamic";

const navigation = {
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { href: "/dashboard/team", label: "Team", icon: Users },
    { href: "/dashboard/shipping", label: "Shipping", icon: FileText },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/commission", label: "Commission", icon: BarChart2 },
  ],
  partner: [
    { href: "/dashboard", label: "My Products", icon: Package },
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  ],
  board: [
    { href: "/dashboard", label: "Upcoming", icon: Package },
    { href: "/dashboard/updates", label: "Updates", icon: FileText },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const navItems = navigation[user.role];

  return (
    <div className="min-h-screen bg-jet text-offwhite flex">
      <aside className="w-64 bg-surface border-r border-border flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-oswald font-semibold text-xl uppercase tracking-[0.02em] text-gold">
              CREAMICE
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-montserrat font-medium transition-colors",
                "hover:bg-charcoal hover:text-gold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted">
            <span className="font-montserrat font-medium">{user.fullName}</span>
            <span className="text-xs uppercase tracking-[0.04em] bg-charcoal px-2 py-0.5 rounded-[2px]">
              {user.role}
            </span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-montserrat font-medium text-muted hover:text-offwhite hover:bg-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="font-oswald font-semibold text-lg uppercase tracking-[0.02em] text-gold">
            CREAMICE
          </span>
          <span className="text-xs uppercase tracking-[0.04em] bg-charcoal px-2 py-0.5 rounded-[2px]">
            {user.role}
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}