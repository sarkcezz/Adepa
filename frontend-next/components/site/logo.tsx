import { cn } from "@/lib/utils";

/** Adepa wordmark with an SVG leaf-and-cut mark, in the brand's Burgundy/Cream palette. */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
        <rect width="40" height="40" rx="11" className="fill-primary" />
        <path
          d="M12 27c0-8 6-14 16-15-1 9-7 15-16 15Z"
          className="fill-[color:var(--accent)]"
          opacity="0.95"
        />
        <path d="M12 27c4-5 8-8 13-10" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
      </svg>
      <span className="leading-none">
        <span
          className={cn(
            "block font-[family-name:var(--font-display)] text-lg font-bold tracking-tight",
            light ? "text-white" : "text-foreground",
          )}
        >
          Adepa
        </span>
        <span className={cn("block text-[10px] font-semibold uppercase tracking-[0.18em]", light ? "text-white/70" : "text-primary")}>
          Pork Hub
        </span>
      </span>
    </span>
  );
}
