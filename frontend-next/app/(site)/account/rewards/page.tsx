"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Cake, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useHasMounted } from "@/lib/cart-store";
import { formatGhs, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const REASON_LABEL: Record<string, string> = {
  ORDER_EARNED: "Earned from order",
  REDEEMED: "Redeemed at checkout",
  REFERRAL_BONUS: "Referral bonus",
  BIRTHDAY_BONUS: "Birthday bonus",
  ADMIN_ADJUST: "Adjustment",
};

interface LedgerRow {
  id: string;
  points: number;
  reason: string;
  note: string | null;
  created_at: string;
}

export default function RewardsPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState<{ balance: number; redeemable_kobo: number; history: LedgerRow[] } | null>(null);
  const [referral, setReferral] = useState<{ code: string; bonus_points: number; referred_count: number; rewarded_count: number } | null>(null);

  useEffect(() => {
    if (mounted && !token) router.replace("/login?next=/account/rewards");
  }, [mounted, token, router]);

  useEffect(() => {
    if (!token) return;
    api<{ balance: number; redeemable_kobo: number; history: LedgerRow[] }>("/account/loyalty", { token })
      .then(setData)
      .catch(() => setData({ balance: 0, redeemable_kobo: 0, history: [] }));
    api<{ code: string; bonus_points: number; referred_count: number; rewarded_count: number }>("/account/referral", { token })
      .then(setReferral)
      .catch(() => {});
  }, [token]);

  function shareLink() {
    if (!referral) return "";
    return typeof window !== "undefined" ? `${window.location.origin}/register?ref=${referral.code}` : "";
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink());
      toast.success("Referral link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  if (!mounted || !token) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Account
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold">Rewards</h1>

      {data === null ? (
        <Skeleton className="mt-8 h-32 w-full rounded-3xl" />
      ) : (
        <div className="mt-8 flex items-center justify-between overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground grain">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Gift className="size-3" /> Adepa Rewards
            </span>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tabular-nums">{data.balance} pts</p>
            <p className="mt-1 text-sm text-primary-foreground/80">Worth {formatGhs(data.redeemable_kobo)} off your next order</p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
        <p>Earn 1 point for every GHS 10 you spend. Redeem points at checkout for GHS 0.10 each.</p>
        <p className="mt-2 flex items-center gap-1.5"><Cake className="size-4 text-primary" /> Add your birthday in <Link href="/account/settings" className="font-semibold text-primary hover:underline">profile settings</Link> to get a bonus every year.</p>
      </div>

      {referral && (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Share2 className="size-4 text-primary" /> Refer a friend</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your link — you both get {referral.bonus_points} points when they place their first order.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-xs">{shareLink()}</code>
            <Button size="sm" variant="outline" className="rounded-full" onClick={copyLink}>
              <Copy className="size-3.5" /> Copy
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {referral.referred_count} signed up · {referral.rewarded_count} rewarded
          </p>
        </div>
      )}

      <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
      <div className="space-y-2">
        {data === null ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
        ) : data.history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No activity yet — place an order to start earning.
          </p>
        ) : (
          data.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3.5 text-sm">
              <div>
                <p className="font-medium">{REASON_LABEL[h.reason] ?? h.reason}</p>
                <p className="text-xs text-muted-foreground">{formatDate(h.created_at)}</p>
              </div>
              <span className={`font-[family-name:var(--font-display)] font-bold tabular-nums ${h.points >= 0 ? "text-primary" : "text-destructive"}`}>
                {h.points >= 0 ? "+" : ""}{h.points}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
