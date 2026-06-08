CREATE TABLE "chat_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"turn_index" integer NOT NULL,
	"user_id" text NOT NULL,
	"sensitivity" text DEFAULT 'private' NOT NULL,
	"user_message" text NOT NULL,
	"redacted_user_message" text,
	"assistant_response" text,
	"redacted_assistant_response" text,
	"detected_pii" jsonb DEFAULT '[]'::jsonb,
	"user_redaction_status" text,
	"assistant_redaction_status" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"error_message_redacted" text,
	"route" text,
	"mode" text,
	"model" text,
	"latency_ms" integer,
	"cost_usd" double precision,
	"cost_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_logs_conversation_turn_unique" UNIQUE("conversation_id","turn_index")
);
--> statement-breakpoint
ALTER TABLE "chat_logs" ADD CONSTRAINT "chat_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_logs_user_conversation_idx" ON "chat_logs" USING btree ("user_id","conversation_id");--> statement-breakpoint
CREATE INDEX "chat_logs_created_at_idx" ON "chat_logs" USING btree ("created_at");