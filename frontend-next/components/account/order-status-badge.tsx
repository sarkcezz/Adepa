import { STATUS_LABEL, STATUS_TONE } from "@/lib/order";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_TONE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
