import Link from "next/link";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Link href="/" className="mb-8 self-center">
          <Logo />
        </Link>
        {children}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
