import { pgTable, text, bigint, timestamp } from "drizzle-orm/pg-core";

export const oauthTokens = pgTable('oauth_tokens', {
    userEmail: text('user_email').primaryKey(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    a_iv: text("a_iv"),
    a_authTag: text("a_auth_tag"),
    r_iv: text("r_iv"),
    r_authTag: text("r_auth_tag"),
    scope: text('scope'),
    tokenType: text('token_type'),
    // Use bigint for expiry_date as it's a Unix timestamp (milliseconds)
    expiryDate: bigint('expiry_date', { mode: 'number' }).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// You can define a type for convenience
export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;