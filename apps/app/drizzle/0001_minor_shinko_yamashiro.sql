DROP INDEX "userIdIndex";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "openDate" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "closeDate" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "instrumentName" text NOT NULL;--> statement-breakpoint
CREATE INDEX "userIdCloseDateIndex" ON "trades" USING btree ("userId","closeDate");