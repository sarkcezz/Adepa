import type { Metadata } from "next";
import { WholesaleForm } from "@/components/site/wholesale-form";
import { SEGMENTS } from "@/lib/wholesale-data";

export const metadata: Metadata = {
  title: "Wholesale Pork — Restaurant Pork Supplier",
  description: "Bulk, wholesale pork supply for restaurants, hotels, butcher shops, retailers, and supermarkets across Kumasi.",
};

export default function WholesalePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Wholesale</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        Bulk pork for your business
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Volume pricing and reliable supply for restaurants, hotels, butcher shops, retailers, and
        supermarkets across Kumasi.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {SEGMENTS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-5 text-center">
            <s.icon className="size-6 text-primary" />
            <span className="text-sm font-semibold">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <WholesaleForm />
      </div>
    </div>
  );
}
