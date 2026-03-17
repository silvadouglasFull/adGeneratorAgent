CREATE INDEX "idx_timestamp" ON "token_consumptions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_model_used" ON "token_consumptions" USING btree ("model_used");