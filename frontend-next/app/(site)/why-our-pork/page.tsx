import type { Metadata } from "next";
import Link from "next/link";
import { Sprout, HeartPulse, Stethoscope, Wheat, Leaf, Clock, BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Why our pork? Healthy, ethically raised pork",
  description: "Healthy pork raised by Symas Farms under veterinary care, on quality feed, ethically handled, and processed fresh.",
};

const REASONS = [
  { icon: Sprout, title: "Raised by Symas Farms", body: "Every cut starts on Symas Farms — our sibling company and sole supplier, so we control quality from the very first day." },
  { icon: HeartPulse, title: "Healthy animals", body: "Pigs are raised in clean, spacious conditions designed for their wellbeing, not just speed to market." },
  { icon: Stethoscope, title: "Veterinary supervision", body: "Regular veterinary checks catch issues early and keep the whole herd healthy." },
  { icon: Wheat, title: "High quality feed", body: "A carefully balanced feed programme — no shortcuts that compromise growth or flavour." },
  { icon: Leaf, title: "Ethically raised", body: "Humane handling from farm to processing, because how the animal is treated shows up in the meat." },
  { icon: Clock, title: "Freshly processed", body: "Cuts move from processing to sale on a tight schedule — no long cold storage before it reaches you." },
  { icon: BadgeCheck, title: "Quality controlled", body: "Every batch is checked for weight, appearance, and handling before it's approved for sale." },
];

export default function WhyOurPorkPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Why our pork?</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        Quality you can trace back to the farm
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Every product we sell comes from one source —{" "}
        <Link href="https://symasfarms.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Symas Farms</Link>{" "}
        — so we can stand behind exactly how it was raised.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r) => (
          <div key={r.title} className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <r.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
