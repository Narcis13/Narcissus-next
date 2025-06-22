CREATE TABLE "oauth_tokens" (
	"user_email" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"scope" text,
	"token_type" text,
	"expiry_date" bigint NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
