CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"strategyName" text NOT NULL,
	"open_position_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"close_position_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "strategy_id" uuid;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "applied_open_rules" jsonb;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "applied_close_rules" jsonb;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "strategy_user_id_idx" ON "strategies" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "trade_strategy_id_idx" ON "trades" USING btree ("strategy_id");