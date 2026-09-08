CREATE TABLE "shipping_settings" (
	"id" varchar(20) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"default_fee_kobo" integer NOT NULL,
	"free_weight_grams" integer NOT NULL,
	"surcharge_per_kg_kobo" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"district" varchar(100) NOT NULL,
	"fee_kobo" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_zones_district_unique" UNIQUE("district")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "auto_apply" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Seed with today's hardcoded shipping.ts values so delivery pricing is unchanged until an admin edits it.
INSERT INTO "shipping_settings" ("id", "default_fee_kobo", "free_weight_grams", "surcharge_per_kg_kobo")
VALUES ('default', 2000, 5000, 200);--> statement-breakpoint
INSERT INTO "shipping_zones" ("district", "fee_kobo") VALUES
	('ejisu', 1000),
	('ejisu-juaben', 1000),
	('bosome freho', 1500),
	('asokwa', 1500),
	('oforikrom', 1500),
	('kumasi metropolitan', 1500),
	('subin', 1500),
	('asokore mampong', 1700),
	('old tafo', 1700),
	('suame', 1700),
	('kwadaso', 1700),
	('bosomtwe', 1800),
	('atwima nwabiagya', 1900),
	('atwima kwanwoma', 1900);