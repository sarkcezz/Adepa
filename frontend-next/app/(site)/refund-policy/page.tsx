import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How refunds and replacements work at Adepa Pork Hub.",
};

const UPDATED = "15 July 2026";

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">Refund policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <Section title="1. Our promise">
          <p>
            Because we sell fresh and processed food, we can&apos;t accept returns of pork once it leaves our
            custody. Instead, we guarantee the order you receive matches what you ordered, arrives in good
            condition, and is safe to eat.
          </p>
        </Section>

        <Section title="2. When you qualify for a refund or replacement">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>The wrong item, weight, or quantity was delivered.</li>
            <li>The product arrived damaged, spoiled, or with a broken cold chain.</li>
            <li>Your order was significantly delayed beyond the estimated delivery window.</li>
            <li>A payment was charged but the order was never confirmed (see our recovery flow at checkout).</li>
          </ul>
        </Section>

        <Section title="3. How to request one">
          <p>
            Contact us within 24 hours of delivery via{" "}
            <a href="mailto:orders@adepaporkhub.shop" className="font-semibold text-primary hover:underline">orders@adepaporkhub.shop</a>{" "}
            or WhatsApp, with your order number and a photo if the issue is visible (damage, wrong item,
            etc.). We aim to respond within one business day.
          </p>
        </Section>

        <Section title="4. What you can expect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Replacement</strong> — we&apos;ll send the correct item on our next available delivery run, at no extra cost.</li>
            <li><strong>Refund</strong> — issued to your original payment method (Paystack) or as reward points/gift card credit, your choice, usually within 5-7 business days.</li>
            <li><strong>Store credit</strong> — for minor issues, we may offer bonus reward points as a goodwill gesture.</li>
          </ul>
        </Section>

        <Section title="5. What isn't covered">
          <p>
            Change of mind after delivery, incorrect address details you provided at checkout, or spoilage
            caused by improper storage after delivery are not eligible for refund. See our{" "}
            <a href="/shipping-policy" className="font-semibold text-primary hover:underline">Shipping Policy</a>{" "}
            and{" "}
            <a href="/food-safety" className="font-semibold text-primary hover:underline">Food Safety</a>{" "}
            pages for storage guidance.
          </p>
        </Section>

        <Section title="6. Cash on delivery and wholesale orders">
          <p>
            For cash-on-delivery orders, refunds are issued as reward points or a gift card credit rather
            than a cash reversal. Wholesale accounts should refer to their agreed terms; contact us directly
            for adjustments.
          </p>
        </Section>

        <Section title="7. Contact us">
          <p>
            Questions about a specific order or this policy:{" "}
            <a href="mailto:orders@adepaporkhub.shop" className="font-semibold text-primary hover:underline">orders@adepaporkhub.shop</a>{" "}
            or WhatsApp from our footer.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
