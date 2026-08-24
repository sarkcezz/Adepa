import Image from "next/image";
import { cn } from "@/lib/utils";

/** Adepa's pig-mark + wordmark lockup. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/Adepa_logo.JPEG"
      alt="Adepa Pork Hub"
      width={1280}
      height={1024}
      className={cn("h-11 w-auto rounded-lg object-contain", className)}
      priority
    />
  );
}
