ALTER TABLE "token_consumptions" ADD COLUMN "helicone_request_id" varchar(100);--> statement-breakpoint
ALTER TABLE "token_consumptions" ADD COLUMN "cost_usd" numeric(12, 8) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_consumptions" ADD COLUMN "cost_brl" numeric(12, 8) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_consumptions" ADD COLUMN "exchange_rate_at_execution" numeric(10, 6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_consumptions" ADD COLUMN "user_id" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "token_consumptions" USING btree ("user_id");