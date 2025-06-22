ALTER TABLE "oauth_tokens" ADD COLUMN "a_iv" text;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD COLUMN "a_auth_tag" text;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD COLUMN "r_iv" text;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD COLUMN "r_auth_tag" text;