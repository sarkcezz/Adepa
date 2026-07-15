import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Common questions about delivery, storage, freshness, payments, returns, and cooking.",
};

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Delivery",
    items: [
      { q: "Where do you deliver?", a: "We deliver across Kumasi and surrounding districts. Delivery fees vary by area — you'll see the exact fee at checkout before you pay." },
      { q: "How fast is delivery?", a: "Most home deliveries arrive same-day when ordered before 3pm. You can track your order live from your account." },
      { q: "Can I pick up instead?", a: "Yes — choose Stand pickup at checkout and select an active stand location. Pickup is free." },
    ],
  },
  {
    title: "Storage",
    items: [
      { q: "How should I store my pork?", a: "Refrigerate immediately and use within 2-3 days, or freeze for longer storage. Check the product page for specific storage instructions." },
      { q: "Can I refreeze thawed pork?", a: "We don't recommend it — refreezing thawed raw pork affects texture and safety. Cook it first if you need to store it longer." },
    ],
  },
  {
    title: "Freshness",
    items: [
      { q: "How fresh is the pork?", a: "All pork comes from Symas Farms and is processed on a tight schedule — most cuts are prepared within a day or two of your order shipping." },
      { q: "What if something looks off?", a: "Contact us immediately with a photo — we'll replace or refund it, no questions asked." },
    ],
  },
  {
    title: "Payments",
    items: [
      { q: "What payment methods do you accept?", a: "Mobile Money, Visa, Mastercard, bank transfer, and cash on delivery for eligible orders." },
      { q: "Is my payment secure?", a: "Yes — online payments are processed through Paystack, a licensed payment processor. We never see or store your card details." },
      { q: "Can I use gift cards or reward points?", a: "Yes, both can be applied at checkout and will reduce your total before payment." },
    ],
  },
  {
    title: "Returns",
    items: [
      { q: "What's your refund policy?", a: "If an order arrives wrong, damaged, or not as described, contact us within 24 hours for a replacement or refund. See our Refund Policy for full details." },
      { q: "Can I cancel an order?", a: "Orders can be cancelled from your account while still marked Pending. Once preparation starts, contact us directly." },
    ],
  },
  {
    title: "Cooking",
    items: [
      { q: "Do you offer cooking guidance?", a: "Yes — check the Cooking Tips section on each product page, or browse our Recipes for full dish ideas." },
      { q: "How do I know pork is cooked safely?", a: "Cook pork to an internal temperature of at least 71°C (160°F). A meat thermometer is the most reliable way to check." },
    ],
  },
];

export default function FaqsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Support</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        Frequently asked questions
      </h1>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-primary">{section.title}</h2>
            <div className="mt-4 space-y-2">
              {section.items.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-border/60 bg-card p-4 open:pb-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                    {item.q}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
