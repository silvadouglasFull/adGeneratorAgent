CREATE TYPE "public"."prompt_type" AS ENUM('text_generation', 'image_generation');--> statement-breakpoint
CREATE TABLE "user_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "prompt_type" NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_prompts_active_unique" ON "user_prompts" USING btree ("user_id","type") WHERE "user_prompts"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_user_prompts_user_id" ON "user_prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_prompts_type" ON "user_prompts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_prompts_active" ON "user_prompts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_prompts_user_type_active" ON "user_prompts" USING btree ("user_id","type","is_active");