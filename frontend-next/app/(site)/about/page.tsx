import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Target, Eye, ShieldCheck, Sprout, Factory } from "lucide-react";

export const metadata: Metadata = {
  title: "About us",
  description: "The story behind Adepa Pork Hub — from Symas Farms to your table.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">About us</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
        From Symas Farms to your table
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Adepa Pork Hub is the retail home of pork raised by{" "}
        <Link href="https://symasfarms.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
          Symas Farms
        </Link>{" "}
        — part of the Symas Group family of businesses.
      </p>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Our story</h2>
        <p className="mt-3 leading-relaxed text-foreground/80">
          Adepa Pork Hub started with a simple frustration: it was hard to find pork in Kumasi you could
          trust — cuts that were fresh, honestly weighed, and traceable back to a real farm. Symas Farms
          had already spent years raising healthy pigs in the Ejisu-Krapa area under proper veterinary
          care. Adepa Pork Hub was built to bring that same pork directly to families, restaurants, and
          shops, without a long chain of middlemen in between.
        </p>
      </section>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card icon={Target} title="Mission">
          Make it easy for every Kumasi household and business to buy fresh, ethically raised pork —
          ordered online, delivered fast, or picked up at a stand.
        </Card>
        <Card icon={Eye} title="Vision">
          To be Ghana's most trusted pork brand — known as much for how the animals are raised as for
          how the meat tastes.
        </Card>
        <Card icon={Heart} title="Quality promise">
          Every cut is butcher-clean, weighed accurately, and sold at a fair price. If something isn't
          right with your order, tell us — we'll make it right.
        </Card>
        <Card icon={ShieldCheck} title="Food safety">
          Cold chain maintained from farm to stand to doorstep. Staff follow strict hygiene protocols,
          and all processing equipment is cleaned and sanitised daily.
        </Card>
        <Card icon={Factory} title="Processing standards">
          Pork is processed in a controlled facility, inspected regularly, with every batch tracked back
          to its source at Symas Farms.
        </Card>
        <Card icon={Sprout} title="Farm to table">
          No long haul, no unnecessary middlemen — pork moves from Symas Farms to our processing point to
          your order in the shortest time we can manage.
        </Card>
      </div>

      <div className="mt-12 rounded-3xl bg-primary p-8 text-center text-primary-foreground grain">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold">Want to see how the pork is raised?</p>
        <p className="mt-2 text-primary-foreground/80">Read more about our farming partner.</p>
        <Link
          href="https://symasfarms.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-primary hover:bg-white/90"
        >
          Visit Symas Farms
        </Link>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
