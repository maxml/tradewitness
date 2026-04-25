ALTER TABLE "trades" ALTER COLUMN "instrumentName" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "deposit" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "close_events" jsonb;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "open_other_details" jsonb;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "close_other_details" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "open_custom_field_names" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "close_custom_field_names" jsonb DEFAULT '[]'::jsonb;