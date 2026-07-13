export type PayMethod = "CASH" | "MOMO" | "CARD";

/** One item line as sent to the employee-sale endpoint. */
export interface SaleLine {
  product_id: string;
  quantity: number;
  line_discount_kobo?: number;
}

/** Body of a POST /orders/employee-sale request. */
export interface SalePayload {
  items: SaleLine[];
  payment_method: PayMethod;
  payment_reference?: string;
  customer_id?: string;
  customer_phone?: string;
  stand_name?: string;
  /** Idempotency key so offline replays can't create duplicate sales. */
  client_reference?: string;
}
