"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { token } = useAuth();
  const router = useRouter();
  const { ids, loaded, load, toggle } = useWishlistStore();

  useEffect(() => {
    if (token && !loaded) void load(token);
  }, [token, loaded, load]);

  const active = ids.has(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!token) {
          toast.info("Sign in to save items to your wishlist.");
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        void toggle(token, productId);
      }}
      className={cn(
        "grid size-8 place-items-center rounded-full bg-background/90 backdrop-blur transition-colors hover:text-primary",
        active ? "text-primary" : "text-muted-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}
