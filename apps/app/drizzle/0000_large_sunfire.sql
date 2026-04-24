CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"positionType" text NOT NULL,
	"openDate" timestamp NOT NULL,
	"openTime" text NOT NULL,
	"closeDate" timestamp NOT NULL,
	"closeTime" text NOT NULL,
	"deposit" text NOT NULL,
	"result" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE INDEX "userIdIndex" ON "trades" USING btree ("userId");