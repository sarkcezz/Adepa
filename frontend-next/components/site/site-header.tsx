"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, User, Menu } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useCart, cartCount, useHasMounted } from "@/lib/cart-store";
import { NotificationBell } from "@/components/notification-bell";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/stands", label: "Stands" },
  { href: "/events", label: "Events" },
];

function CartBadge() {
  const mounted = useHasMounted();
  const count = useCart((s) => cartCount(s.items));
  if (!mounted || count === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground ring-2 ring-background">
      {count}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Adepa Pork Hub home">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive(n.href)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="relative rounded-full" render={<Link href="/cart" aria-label="Cart" />}>
            <ShoppingBag className="size-5" />
            <CartBadge />
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" className="rounded-full max-md:hidden" render={<Link href="/account" aria-label="Account" />}>
            <User className="size-5" />
          </Button>
          <Button className="ml-1 rounded-full max-md:hidden" render={<Link href="/menu" />}>
            Order now
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Menu" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 max-w-[88vw] p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="border-b border-border/60 px-6 py-5">
                  <Logo />
                </div>
                <nav className="flex flex-col gap-1 p-4">
                  {NAV.map((n) => (
                    <SheetClose
                      key={n.href}
                      render={
                        <Link
                          href={n.href}
                          className={cn(
                            "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                            isActive(n.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary",
                          )}
                        />
                      }
                    >
                      {n.label}
                    </SheetClose>
                  ))}
                  <div className="my-2 border-t border-border/60" />
                  <SheetClose
                    render={<Link href="/account" className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-secondary" />}
                  >
                    My account
                  </SheetClose>
                </nav>
                <div className="mt-auto p-4">
                  <Button className="w-full rounded-full" size="lg" render={<Link href="/menu" onClick={() => setOpen(false)} />}>
                    Order now
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
