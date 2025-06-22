"use server";

import { db } from "@/lib/db";// Assuming your Drizzle instance is exported from here
import { oauthTokens } from "@/db/schema/oauth_tokens";
import { eq } from "drizzle-orm";
import type { Credentials } from "google-auth-library";
import { encrypt, decrypt } from "@/lib/security/crypto";
import { GoogleOAuth2Helper } from "@/lib/helpers/google-oauth2-helper";
import { get } from "http";

// Define the structure of the token data we'll retrieve
export interface StoredTokenInfo extends Credentials {
    user_email: string;
    refresh_token: string;
    updated_at: string;
}

/**
 * Saves or updates tokens for a specific user using Drizzle's "upsert".
 * @param email The user's email address (primary key).
 * @param tokens The tokens received from Google.
 */
export async function saveOrUpdateTokens(email: string, tokens: Credentials): Promise<void> {
    if (!tokens.access_token || !tokens.expiry_date) {
        throw new Error("Cannot save tokens without access_token and expiry_date.");
    }
    const encryptedAccessToken = encrypt(tokens.access_token);
    if (!tokens.refresh_token) {
        // If Google doesn't return a refresh token (e.g., on subsequent logins),
        // we must update the other fields without overwriting the existing refresh token.
        console.log(`Updating tokens for ${email} (without changing refresh_token).`);
       
        await db.update(oauthTokens)
            .set({
                accessToken: encryptedAccessToken.encryptedData,
                a_iv: encryptedAccessToken.iv,
                a_authTag: encryptedAccessToken.authTag,
                scope: tokens.scope,
                tokenType: tokens.token_type,
                expiryDate: tokens.expiry_date,
                updatedAt: new Date(),
            })
            .where(eq(oauthTokens.userEmail, email));
    } else {
        // This is for the first-time login or when a new refresh token is explicitly granted.
        console.log(`Saving/updating tokens for ${email} (with new refresh_token).`);
        const encryptedRefreshToken = encrypt(tokens.refresh_token);
        await db.insert(oauthTokens)
            .values({
                userEmail: email,
                accessToken: encryptedAccessToken.encryptedData,
                a_iv: encryptedAccessToken.iv,
                a_authTag: encryptedAccessToken.authTag,
                refreshToken: encryptedRefreshToken.encryptedData,
                r_iv: encryptedRefreshToken.iv,
                r_authTag: encryptedRefreshToken.authTag,
                
                scope: tokens.scope,
                tokenType: tokens.token_type,
                expiryDate: tokens.expiry_date,
            })
            .onConflictDoUpdate({
                target: oauthTokens.userEmail,
                set: {
                    accessToken: encryptedAccessToken.encryptedData,
                    a_iv: encryptedAccessToken.iv,
                    a_authTag: encryptedAccessToken.authTag,
                    scope: tokens.scope,
                    tokenType: tokens.token_type,
                    expiryDate: tokens.expiry_date,
                    // We don't update refreshToken on conflict, as the old one is likely still valid
                    updatedAt: new Date(),
                }
            });
    }
}

/**
 * Retrieves the stored token information for a user.
 * @param email The user's email.
 * @returns The stored token info or null if not found.
 */
export async function getTokensForUser(email: string) {
    const result = await db.select().from(oauthTokens).where(eq(oauthTokens.userEmail, email));
    return result[0] || null;
}

/**
 * Retrieves only the refresh token for a user.
 * @param email The user's email.
 * @returns The decrypted refresh token or null if not found.
 */
export async function getRefreshTokenForUser(email: string): Promise<string | null> {
    const result = await db.select().from(oauthTokens).where(eq(oauthTokens.userEmail, email));
    const storedTokens = result[0];
    
    if (!storedTokens || !storedTokens.refreshToken) {
        return null;
    }
    
    // Check if the refresh token was encrypted (has IV and auth tag)
    if (!storedTokens.r_iv || !storedTokens.r_authTag) {
        // Token wasn't encrypted, return as is
        return storedTokens.refreshToken;
    }
    
    // Token was encrypted, decrypt it
    const decryptedRefreshToken = decrypt({
        iv: storedTokens.r_iv,
        encryptedData: storedTokens.refreshToken,
        authTag: storedTokens.r_authTag
    });
    
    return decryptedRefreshToken;
}

/**
 * Gets a valid access token for a user, automatically refreshing it if it's expired.
 * @param email The user's email.
 * @returns A valid access token, or null if no refresh token is found or refresh fails.
 */
export async function getValidAccessToken(email: string): Promise<string | null> {
    const storedTokens = await getTokensForUser(email);

    if (!storedTokens || !storedTokens.refreshToken) {
        console.warn(`No stored refresh token for ${email}. Cannot get access token.`);
        return null;
    }

    // Check if the token is expired or will expire in the next 60 seconds
    const isExpired = Date.now() >= (storedTokens.expiryDate - 60000);
    const decryptedAccessToken = decrypt({iv: storedTokens.a_iv!, encryptedData: storedTokens.accessToken, authTag: storedTokens.a_authTag!});
    const decryptedRefreshToken = await getRefreshTokenForUser(email);
    if (isExpired) {
        console.log(`Access token for ${email} has expired. Refreshing...`);
        try {
            const oauth2Helper = new GoogleOAuth2Helper(
                process.env.GOOGLE_CLIENT_ID!,
                process.env.GOOGLE_CLIENT_SECRET!,
                process.env.GOOGLE_REDIRECT_URI!
            );

            const newCredentials = await oauth2Helper.refreshAccessToken(decryptedRefreshToken!);
            const updatedTokens: Credentials = {
                ...newCredentials,
                refresh_token: storedTokens.refreshToken, // The refresh response doesn't include a new refresh token.
            };

            await saveOrUpdateTokens(email, updatedTokens);

            return updatedTokens.access_token!;
        } catch (error) {
            console.error(`Failed to refresh access token for ${email}:`, error);
            return null; // Refresh failed
        }
    } else {
        console.log(`Existing access token for ${email} is still valid.`);
        return decryptedAccessToken;
    }
}