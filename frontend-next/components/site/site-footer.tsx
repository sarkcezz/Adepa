import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterSignup } from "./newsletter-signup";
import { FacebookIcon, InstagramIcon, TikTokIcon, YoutubeIcon } from "./social-icons";

const WHATSAPP = "233500000000";

const SOCIALS = [
  { icon: FacebookIcon, href: process.env.NEXT_PUBLIC_FACEBOOK_URL, label: "Facebook" },
  { icon: InstagramIcon, href: process.env.NEXT_PUBLIC_INSTAGRAM_URL, label: "Instagram" },
  { icon: TikTokIcon, href: process.env.NEXT_PUBLIC_TIKTOK_URL, label: "TikTok" },
  { icon: YoutubeIcon, href: process.env.NEXT_PUBLIC_YOUTUBE_URL, label: "YouTube" },
].filter((s) => !!s.href);

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/40 print:hidden">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Fresh, ethically raised Ghanaian pork from Symas Farms. Butcher-clean cuts to
            fire-grilled platters, delivered across Kumasi.
          </p>
          <NewsletterSignup />
          {SOCIALS.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-8 place-items-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-primary"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <FooterCol
          heading="Shop"
          links={[
            ["All products", "/menu"],
            ["Recipes", "/recipes"],
            ["Wholesale", "/wholesale"],
            ["Promotions", "/promotions"],
          ]}
        />
        <FooterCol
          heading="Company"
          links={[
            ["About us", "/about"],
            ["Why our pork?", "/why-our-pork"],
            ["Stand locations", "/stands"],
            ["Pork events", "/events"],
            ["Blog", "/blog"],
            ["Reviews", "/reviews"],
          ]}
        />

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Help & contact</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
              >
                <MessageCircle className="size-4" /> Need help? WhatsApp us
              </a>
            </li>
            <li>
              <a href="mailto:orders@adepaporkhub.shop" className="hover:text-foreground">
                orders@adepaporkhub.shop
              </a>
            </li>
            <li>Ejisu-Krapa, Ashanti Region</li>
            <li className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary" /> Open today · 8am–8pm
              </span>
            </li>
            <li className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
              <Link href="/faqs" className="hover:text-foreground">FAQs</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Adepa Pork Hub. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/refund-policy" className="hover:text-foreground">Refund policy</Link>
            <Link href="/shipping-policy" className="hover:text-foreground">Shipping policy</Link>
            <Link href="/food-safety" className="hover:text-foreground">Food safety</Link>
            <p>Made with care in Ghana</p>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-1.5 px-4 pb-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>Part of</span>
          <a href="https://symasgroup.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary">
            Symas Group
          </a>
          <span>· Pork sourced from</span>
          <a href="https://symasfarms.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary">
            Symas Farms
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }: { heading: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{heading}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
