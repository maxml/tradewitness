ALTER TABLE "trades" ALTER COLUMN "symbolName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "capital" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "tokens" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "profitOrLoss";