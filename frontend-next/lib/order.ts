import type { OrderStatus } from "./types";

export const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "OUT_FOR_DELIVERY", label: "On the way" },
  { key: "DELIVERED", label: "Delivered" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Tailwind classes for a status pill. */
export const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-primary/10 text-primary",
  PREPARING: "bg-accent/20 text-accent-foreground",
  OUT_FOR_DELIVERY: "bg-accent/25 text-accent-foreground",
  DELIVERED: "bg-primary/15 text-primary",
  CANCELLED: "bg-destructive/10 text-destructive",
};

/** Per-status hero copy for the live tracking page. */
export const TRACK_HERO: Record<OrderStatus, { headline: string; sub: string; eta: string | null }> = {
  PENDING: { headline: "We've got your order", sub: "Confirming it now.", eta: "Confirmation in a few minutes" },
  CONFIRMED: { headline: "Order confirmed", sub: "Our kitchen has it.", eta: "Prep starts shortly" },
  PREPARING: { headline: "On the fire", sub: "Freshly prepared, the way it should be.", eta: "Ready in 20–30 min" },
  OUT_FOR_DELIVERY: { headline: "On its way to you", sub: "Your rider is heading over.", eta: "Arriving soon" },
  DELIVERED: { headline: "Delivered. Enjoy!", sub: "Thanks for choosing Adepa.", eta: null },
  CANCELLED: { headline: "Order cancelled", sub: "Reach out if this is unexpected.", eta: null },
};

export const isTerminal = (s: OrderStatus) => s === "DELIVERED" || s === "CANCELLED";
export const isActive = (s: OrderStatus) => !isTerminal(s);
