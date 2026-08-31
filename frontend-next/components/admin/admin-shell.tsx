"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Megaphone, Calendar, Tag,
  Users, UserCircle, BarChart3, FileText, LogOut, Menu, X, ExternalLink, Calculator,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";

type Item = { href: string; label: string; icon: typeof LayoutDashboard; soon?: boolean };

const GROUPS: { heading: string; items: Item[] }[] = [
  {
    heading: "Operate",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/products", label: "Products", icon: Package },
    ],
  },
  {
    heading: "Engage",
    items: [
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/events", label: "Events", icon: Calendar },
      { href: "/admin/campaigns", label: "Campaigns", icon: Tag },
    ],
  },
  {
    heading: "People & insight",
    items: [
      { href: "/admin/employees", label: "Employees", icon: Users },
      { href: "/admin/customers", label: "Customers", icon: UserCircle },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit log", icon: FileText },
    ],
  },
  {
    heading: "Planning",
    items: [
      { href: "/admin/financials", label: "Financial model", icon: Calculator },
    ],
  },
];

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.heading}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{g.heading}</p>
          <div className="space-y-0.5">
            {g.items.map((n) => {
              const Icon = n.icon;
              if (n.soon) {
                return (
                  <div key={n.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/50">
                    <Icon className="size-4" />
                    {n.label}
                    <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">soon</span>
                  </div>
                );
              }
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active(n.href) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    if (!token) router.replace("/login?next=/admin");
    else if (user && user.role !== "admin") router.replace("/");
    else if (user?.force_password_change) router.replace("/change-password");
  }, [mounted, token, user, router]);

  if (!mounted || !token || user?.role !== "admin" || user?.force_password_change) return null;

  return (
    <div className="min-h-svh bg-secondary/20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="rounded-full p-2 hover:bg-secondary lg:hidden" aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Logo />
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/" className="hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
              View store <ExternalLink className="size-3.5" />
            </Link>
            <button onClick={() => { logout(); router.push("/"); }} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-muted">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-border/60 bg-card p-4">
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] overflow-y-auto bg-card p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-5"><Logo /></div>
              <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
