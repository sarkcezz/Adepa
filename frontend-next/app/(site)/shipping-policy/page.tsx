import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: "Delivery areas, fees, timing, and pickup options at Adepa Pork Hub.",
};

const UPDATED = "15 July 2026";

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">Shipping policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <Section title="1. Delivery areas">
          <p>
            We deliver across Kumasi and surrounding districts, based out of our processing point in
            Ejisu-Krapa, Ashanti Region. If you&apos;re outside our usual delivery radius, choose Stand
            pickup at checkout, or contact us to confirm we can reach you.
          </p>
        </Section>

        <Section title="2. Delivery fees">
          <p>
            Home delivery fees are calculated at checkout based on your district and the total weight of
            your order — you&apos;ll always see the exact fee before you pay, never a surprise charge after.
            Stand pickup is always free.
          </p>
        </Section>

        <Section title="3. Delivery timing">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Same-day delivery</strong> — orders placed before 3pm are typically delivered the same day.</li>
            <li><strong>Next-day delivery</strong> — orders placed later, or during high demand, are delivered the following day.</li>
            <li><strong>Scheduled delivery</strong> — for events or bulk orders, contact us to arrange a specific delivery date.</li>
          </ul>
        </Section>

        <Section title="4. Cold chain">
          <p>
            All pork is transported in insulated, temperature-controlled packaging to preserve freshness
            from our processing point to your door. Refrigerate or freeze your order as soon as it arrives.
          </p>
        </Section>

        <Section title="5. Pickup">
          <p>
            Choose Stand pickup at checkout to collect from one of our active stand locations — see{" "}
            <a href="/stands" className="font-semibold text-primary hover:underline">Stand locations</a>{" "}
            for what&apos;s currently open. Bring your order number when collecting.
          </p>
        </Section>

        <Section title="6. Missed or delayed deliveries">
          <p>
            If your delivery is significantly delayed or a driver can&apos;t reach you, we&apos;ll contact you via
            the phone number on your order. Repeated failed delivery attempts due to an incorrect address
            may incur a re-delivery fee.
          </p>
        </Section>

        <Section title="7. Contact us">
          <p>
            Delivery questions:{" "}
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
