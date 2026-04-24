ALTER TABLE "trades" ADD COLUMN "symbolName" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "entryPrice" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "totalCost" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "quantity" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "sellPrice" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "quantitySold" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "profitOrLoss" text;--> statement-breakpoint
ALTER TABLE "feedbacks" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "feedbacks" DROP COLUMN "avatar";