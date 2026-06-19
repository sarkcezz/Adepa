import { Check, Clock, ChefHat, Truck, PackageCheck, XCircle } from "lucide-react";
import { ORDER_STEPS } from "@/lib/order";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = [Clock, Check, ChefHat, Truck, PackageCheck];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-destructive">
        <XCircle className="size-5" />
        <span className="font-semibold">This order was cancelled.</span>
      </div>
    );
  }

  const current = ORDER_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="relative">
      {/* connecting rail */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border sm:inset-x-10 sm:top-5 sm:bottom-auto sm:h-0.5 sm:w-auto" />
      <ol className="grid gap-5 sm:grid-cols-5 sm:gap-2">
        {ORDER_STEPS.map((step, i) => {
          const Icon = ICONS[i];
          const done = i <= current;
          const active = i === current;
          return (
            <li key={step.key} className="relative flex items-center gap-3 sm:flex-col sm:text-center">
              <span
                className={cn(
                  "relative z-10 grid size-10 shrink-0 place-items-center rounded-full transition-colors",
                  done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  active && "ring-4 ring-primary/20",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
