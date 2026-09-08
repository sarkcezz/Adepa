import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Adepa's pig-mark + wordmark lockup. The source file is a JPEG with a pale
 * pink background baked into the pixels (no alpha channel) — mix-blend-mode
 * drops out those near-white pixels so it sits on any of the app's warm
 * cream/card surfaces without a visible box around it.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/Adepa_logo.JPEG"
      alt="Adepa Pork Hub"
      width={1280}
      height={1024}
      className={cn("h-11 w-auto object-contain mix-blend-multiply", className)}
      priority
    />
  );
}
