ALTER TABLE "trades" ALTER COLUMN "closeDate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "closeTime" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "result" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "isActiveTrade" boolean DEFAULT true NOT NULL;