CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"content" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tokens" integer;--> statement-breakpoint
CREATE INDEX "report_id_idx" ON "report" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_dialog_user_id_idx" ON "report" USING btree ("user_id");