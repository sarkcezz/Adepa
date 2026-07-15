import type { Metadata } from "next";
import Link from "next/link";
import { Tag, Package, PartyPopper, Share2, Gift } from "lucide-react";
import { publicApi } from "@/lib/api";
import { formatGhs } from "@/lib/format";
import { GiftCardPurchase } from "@/components/site/gift-card-purchase";

export const metadata: Metadata = {
  title: "Promotions",
  description: "Current discounts, bundles, holiday specials, our referral programme, and gift cards.",
};

interface Campaign {
  id: string;
  name: string;
  code: string;
  discount_type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
  discount_value: number;
  min_order_kobo: number;
}

async function getActiveCampaigns() {
  try {
    return (await publicApi<{ data: Campaign[] }>("/campaigns/active", 60)).data;
  } catch {
    return [];
  }
}

function describeCampaign(c: Campaign): string {
  if (c.discount_type === "PERCENT") return `${c.discount_value}% off`;
  if (c.discount_type === "FIXED") return `${formatGhs(c.discount_value)} off`;
  return "Free delivery";
}

export default async function PromotionsPage() {
  const campaigns = await getActiveCampaigns();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Promotions</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        Deals, bundles &amp; gift cards
      </h1>

      {/* Active discounts */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          <Tag className="size-5 text-primary" /> Active discounts
        </h2>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No active promo codes right now — check back soon, or browse the <Link href="/menu" className="font-semibold text-primary hover:underline">menu</Link>.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border/60 bg-card p-5">
                <p className="font-semibold">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{describeCampaign(c)}{c.min_order_kobo > 0 ? ` on orders over ${formatGhs(c.min_order_kobo)}` : ""}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
                  {c.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bundles & holiday specials */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          <Package className="size-5 text-primary" /> Bundles &amp; family packs
        </h2>
        <p className="mt-3 text-muted-foreground">
          Look for Family Packs, BBQ Packs, and Restaurant Packs in the{" "}
          <Link href="/menu" className="font-semibold text-primary hover:underline">menu</Link> — pre-bundled
          combinations at a better price per kilo than buying separately.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          <PartyPopper className="size-5 text-primary" /> Holiday specials
        </h2>
        <p className="mt-3 text-muted-foreground">
          We run limited-time promo codes around Christmas, Easter, and Eid — active codes always show
          in the Active discounts section above, and we'll email/SMS you if you have an account.
        </p>
      </section>

      {/* Referral */}
      <section className="mt-12 rounded-3xl bg-primary p-8 text-primary-foreground grain">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          <Share2 className="size-5" /> Refer a friend
        </h2>
        <p className="mt-2 max-w-lg text-primary-foreground/80">
          Share your referral link — you and your friend both get bonus reward points when they place
          their first order.
        </p>
        <Link
          href="/account/rewards"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-primary hover:bg-white/90"
        >
          Get my referral link
        </Link>
      </section>

      {/* Gift cards */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-bold">
          <Gift className="size-5 text-primary" /> Gift cards
        </h2>
        <p className="mt-3 text-muted-foreground">
          Buy a gift card for someone who loves good pork — redeemable at checkout on any order.
        </p>
        <div className="mt-4 max-w-md">
          <GiftCardPurchase />
        </div>
      </section>
    </div>
  );
}
