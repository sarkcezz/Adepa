"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, History, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/staff", label: "Sell", icon: LayoutGrid },
  { href: "/staff/history", label: "History", icon: History },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  const mounted = useHasMounted();
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (!mounted) return;
    if (!token) router.replace("/login?next=/staff");
    else if (user && user.role !== "employee" && user.role !== "admin") router.replace("/");
  }, [mounted, token, user, router]);

  if (!mounted || !token || (user?.role !== "employee" && user?.role !== "admin")) return null;

  const active = (href: string) => (href === "/staff" ? pathname === "/staff" : pathname.startsWith(href));
  const onReceipt = pathname.includes("/receipt");

  return (
    <div className="flex min-h-svh flex-col bg-secondary/20">
      {!onReceipt && (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/staff" className="flex items-center gap-2">
              <Logo />
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">POS</span>
            </Link>

            <nav className="flex items-center gap-1 rounded-full bg-secondary p-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                      active(n.href) ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden text-right text-[11px] leading-tight sm:block">
                <p className="font-mono">{user.employee_id}</p>
                <p className="text-muted-foreground">{user.name?.split(" ")[0]}</p>
              </div>
              <button onClick={() => { logout(); router.push("/login"); }} className="grid size-9 place-items-center rounded-full bg-secondary hover:bg-muted" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1", onReceipt ? "" : "p-3 sm:p-4")}>{children}</main>
    </div>
  );
}
