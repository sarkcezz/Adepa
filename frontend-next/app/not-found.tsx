import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-4 text-center">
      <div>
        <p className="font-[family-name:var(--font-display)] text-6xl font-bold text-primary">404</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">That page has wandered off. Let&apos;s get you back.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button className="rounded-full" render={<Link href="/" />}>Home</Button>
          <Button variant="outline" className="rounded-full" render={<Link href="/menu" />}>Browse menu</Button>
        </div>
      </div>
    </div>
  );
}
