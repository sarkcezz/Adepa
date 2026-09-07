ALTER TABLE "event_registrations" ADD COLUMN "companions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "management_code" varchar(12);--> statement-breakpoint
UPDATE "event_registrations" SET "management_code" = upper(substr(md5(gen_random_uuid()::text || id::text), 1, 8)) WHERE "management_code" IS NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ALTER COLUMN "management_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_management_code_unique" UNIQUE("management_code");