import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you order from Adepa Pork Hub.",
};

const UPDATED = "12 July 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">Terms of service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <Section title="1. About Adepa">
          <p>
            Adepa Pork Hub is based in Ejisu-Krapa, Ashanti Region, and currently delivers across Kumasi.
            By creating an account or placing an order with us, you agree to these terms.
          </p>
        </Section>

        <Section title="2. Orders and pricing">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>All prices are listed in Ghana Cedis (GHS) and include applicable taxes unless stated otherwise.</li>
            <li>Product availability and stock levels can change; we&apos;ll notify you if an item in your order becomes unavailable.</li>
            <li>We reserve the right to correct pricing errors before an order is confirmed.</li>
            <li>Promo codes are subject to their individual terms (minimum order, validity dates, usage limits) shown at checkout.</li>
          </ul>
        </Section>

        <Section title="3. Payment">
          <p>
            Online orders are paid via Paystack (card or mobile money). Payment is verified before an
            order is confirmed. Pickup orders may be paid on collection. We never see or store your card
            number or mobile money PIN.
          </p>
        </Section>

        <Section title="4. Delivery">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Home delivery is currently available across Kumasi for a flat fee shown at checkout.</li>
            <li>Stand pickup is free — collect from any published stand location.</li>
            <li>Delivery times are estimates; we&apos;ll keep you updated on your order&apos;s status.</li>
          </ul>
        </Section>

        <Section title="5. Cancellations">
          <p>
            You can cancel an order yourself only while it is still <strong>Placed</strong> (before we
            begin preparing it), from your order history. Once an order has been confirmed, contact us
            directly and we&apos;ll do our best to accommodate changes, but preparation may already be
            underway.
          </p>
        </Section>

        <Section title="6. Food safety and returns">
          <p>
            As a fresh food retailer, we cannot accept returns of perishable goods once delivered.
            If an item arrives damaged, incorrect, or not as described, contact us within 24 hours with
            photos and we&apos;ll make it right — a replacement or refund, at our discretion.
          </p>
        </Section>

        <Section title="7. Events">
          <p>
            Registration for pork events is confirmed on payment (where applicable). If we cancel an
            event, registered attendees will be notified and refunded in full.
          </p>
        </Section>

        <Section title="8. Account responsibilities">
          <p>
            You&apos;re responsible for keeping your password confidential and for all activity under your
            account. Let us know immediately if you suspect unauthorised access.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            We aim to fulfil every order accurately and on time, but we&apos;re not liable for delays or
            issues caused by circumstances outside our reasonable control (e.g. severe weather, road
            closures, third-party payment or courier failures).
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms from time to time; the &quot;last updated&quot; date above reflects
            the latest revision. Continued use of Adepa after a change means you accept the updated terms.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>These terms are governed by the laws of Ghana.</p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:orders@adepaporkhub.shop" className="font-semibold text-primary hover:underline">
              orders@adepaporkhub.shop
            </a>.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground">
          This document is a general template and is not a substitute for legal advice tailored to your
          business.
        </p>
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
