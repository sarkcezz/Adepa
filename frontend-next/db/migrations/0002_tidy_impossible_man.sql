ALTER TABLE "orders" ADD COLUMN "loyalty_points_redeemed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "loyalty_kobo" integer DEFAULT 0 NOT NULL;