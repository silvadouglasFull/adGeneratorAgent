CREATE TYPE "public"."token_consumption_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "token_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"model_used" varchar(50) NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_consumptions_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_request_id" ON "token_consumptions" USING btree ("request_id");