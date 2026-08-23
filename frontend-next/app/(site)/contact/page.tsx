import type { Metadata } from "next";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Phone, WhatsApp, email, and our Ejisu-Krapa location — get in touch with Adepa Pork Hub.",
};

const WHATSAPP = "233240425561";
const PHONE = "+233 24 042 5561";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Contact</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">Get in touch</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Questions about an order, delivery, or wholesale? Reach us however&apos;s easiest.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <ContactRow icon={Phone} label="Phone" value={PHONE} href={`tel:${PHONE.replace(/\s/g, "")}`} />
          <ContactRow icon={MessageCircle} label="WhatsApp" value="Chat with us" href={`https://wa.me/${WHATSAPP}`} />
          <ContactRow icon={Mail} label="Email" value="orders@adepaporkhub.shop" href="mailto:orders@adepaporkhub.shop" />
          <ContactRow icon={MapPin} label="Location" value="Ejisu-Krapa, Ashanti Region — delivering across Kumasi" />
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <iframe
              title="Adepa Pork Hub location"
              src="https://www.google.com/maps?q=Ejisu-Krapa,+Ashanti+Region,+Ghana&output=embed"
              className="h-56 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block transition-opacity hover:opacity-80">
      {content}
    </a>
  ) : content;
}
