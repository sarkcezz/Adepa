import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= Math.round(value) ? "fill-accent text-accent" : "text-border")}
        />
      ))}
    </span>
  );
}

/** Interactive 1-5 star picker for review submission. */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star className={cn("size-6 transition-colors", n <= value ? "fill-accent text-accent" : "text-border hover:text-accent/60")} />
        </button>
      ))}
    </span>
  );
}
