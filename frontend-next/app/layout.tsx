import type { Metadata, Viewport } from "next";
import { Fraunces, Karla, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import { Analytics } from "@/components/analytics";
import "./globals.css";

// Adepa's own "Farmhouse Warm" identity — Fraunces for headings, Karla for
// body — a deliberate departure from the Playfair Display/Inter pairing
// shared with symasgroup.com and symasfarms.com (Symas group/symasgroup.md §13).
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Karla({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Adepa Pork Hub — Premium Ghanaian pork, delivered",
    template: "%s · Adepa Pork Hub",
  },
  description:
    "Fresh, ethically raised Ghanaian pork from Symas Farms. Butcher-clean cuts, spiced platters, and ready-to-eat favourites delivered across Kumasi.",
};

export const viewport: Viewport = {
  themeColor: "#7A342B",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  );
}
