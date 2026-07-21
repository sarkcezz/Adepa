import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Adepa Pork Hub collects, uses, and protects your information.",
};

const UPDATED = "21 July 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <span className="eyebrow">Legal</span>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <Section title="1. Who we are">
          <p>
            Adepa Pork Hub (&quot;Adepa&quot;, &quot;we&quot;, &quot;us&quot;) operates a pork butchery and
            e-commerce platform based in Ejisu-Krapa, Ashanti Region, delivering across Kumasi. This
            policy explains what information we collect through our website and staff point-of-sale
            system, and how we use it.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Account details</strong> — name, email, phone number, and password (stored as a salted hash, never in plain text). If you sign in with Google, we receive your name, email address, and whether Google has verified that email — we never receive or see your Google password.</li>
            <li><strong>Delivery addresses</strong> — recipient name, phone, area, district, and landmark for the addresses you save.</li>
            <li><strong>Order history</strong> — items purchased, amounts, delivery method, and status timeline.</li>
            <li><strong>Payment confirmation</strong> — we receive a payment reference and status from Paystack; we do not receive or store your card or mobile money PIN.</li>
            <li><strong>Device information</strong> — your cart and session are kept in your browser&apos;s local storage so you stay signed in and don&apos;t lose your cart.</li>
          </ul>
        </Section>

        <Section title="3. How we use your information">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To process and deliver your orders, and to contact you about their status.</li>
            <li>To operate your account, including password resets and order history.</li>
            <li>To send order confirmations and delivery updates by email and/or SMS.</li>
            <li>To improve our menu, stands, and service based on order patterns.</li>
            <li>To detect and prevent fraud or abuse of our platform.</li>
          </ul>
          <p className="mt-2">We do not sell your personal information, and we do not use it for third-party advertising.</p>
        </Section>

        <Section title="4. Who we share it with">
          <p>We share the minimum necessary information with:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong>Paystack</strong> — to process card and mobile money payments.</li>
            <li><strong>Google</strong> — if you choose to sign in with Google, we exchange an authorization code with Google to confirm your identity and retrieve your name and email.</li>
            <li><strong>Our hosting and database providers</strong> (Vercel, Neon) — to run the application and store data securely.</li>
            <li><strong>SMS/email providers</strong> — to deliver order and account notifications.</li>
          </ul>
          <p className="mt-2">We do not share your data with anyone else without your consent, unless required by law.</p>
        </Section>

        <Section title="5. Data retention">
          <p>
            We keep your account and order history for as long as your account is active, so you can
            view past orders and reorder easily. You can ask us to delete your account and associated
            personal data at any time (see Contact below) — we&apos;ll retain only what we&apos;re legally
            required to for accounting and tax purposes.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>Under Ghana&apos;s Data Protection Act, 2012 (Act 843), you have the right to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate information (you can edit your profile and addresses directly in your account).</li>
            <li>Request deletion of your account and data.</li>
            <li>Withdraw consent to marketing communications at any time.</li>
          </ul>
        </Section>

        <Section title="7. Security">
          <p>
            Passwords are hashed with bcrypt and never stored or transmitted in plain text. All traffic
            to our site is encrypted (HTTPS). We restrict access to customer data to staff who need it to
            fulfil orders.
          </p>
        </Section>

        <Section title="8. Contact us">
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a href="mailto:orders@adepaporkhub.shop" className="font-semibold text-primary hover:underline">
              orders@adepaporkhub.shop
            </a>{" "}
            or via WhatsApp from our footer.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground">
          This policy is provided as a general description of our practices and is not a substitute for
          legal advice specific to your circumstances.
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
