import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food safety",
  description: "How Adepa Pork Hub handles food safety from farm to delivery.",
};

const UPDATED = "15 July 2026";

export default function FoodSafetyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">Food safety</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <Section title="1. Sourcing">
          <p>
            All pork sold on Adepa Pork Hub is raised by Symas Farms under regular veterinary supervision,
            on a controlled feed programme, and handled humanely from birth through processing.
          </p>
        </Section>

        <Section title="2. Processing standards">
          <p>
            Pork is processed in a controlled facility with equipment cleaned and sanitised daily. Staff
            follow strict hygiene protocols, including handwashing, protective clothing, and separation of
            raw and ready-to-eat products to prevent cross-contamination.
          </p>
        </Section>

        <Section title="3. Cold chain">
          <p>
            Temperature is controlled at every step — storage, packaging, and delivery — using insulated
            transport to keep products at a safe temperature until they reach you.
          </p>
        </Section>

        <Section title="4. Quality checks">
          <p>
            Every batch is checked for weight, appearance, and correct labelling before it&apos;s approved for
            sale. Products that don&apos;t meet our standard are never sold.
          </p>
        </Section>

        <Section title="5. Storage guidance for you">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Refrigerate raw pork immediately and use within 2-3 days, or freeze for longer storage.</li>
            <li>Cook pork to an internal temperature of at least 71°C (160°F).</li>
            <li>Don&apos;t refreeze thawed raw pork — cook it first if you need to store it longer.</li>
            <li>Ready-to-eat items should be reheated thoroughly before serving.</li>
          </ul>
        </Section>

        <Section title="6. If something's wrong">
          <p>
            If a product ever looks, smells, or feels off, don&apos;t consume it — contact us immediately with
            a photo and your order number. See our{" "}
            <a href="/refund-policy" className="font-semibold text-primary hover:underline">Refund Policy</a>{" "}
            for what happens next.
          </p>
        </Section>

        <Section title="7. Contact us">
          <p>
            Food safety concerns:{" "}
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
