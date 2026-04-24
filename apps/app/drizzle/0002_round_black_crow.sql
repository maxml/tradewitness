CREATE TABLE "user" (
	"id" text NOT NULL,
	"capital" text NOT NULL,
	CONSTRAINT "user_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "id" DROP DEFAULT;