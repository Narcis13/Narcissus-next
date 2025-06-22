import { GoogleOAuth2Helper } from "@/lib/helpers/google-oauth2-helper";
import { saveOrUpdateTokens } from "@/actions/token-storage";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error('OAuth error from Google:', error);
            return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 });
        }
        
        if (!code) {
            console.error('No authorization code provided');
            return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 });
        }

        // Create a fresh instance for the token exchange
        const oauth2Helper = new GoogleOAuth2Helper(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            process.env.GOOGLE_REDIRECT_URI!
        );

        // Note: The original code's PKCE implementation is not robust for a stateless
        // serverless environment because `codeVerifier` is stored in memory on the class instance.
        // A robust PKCE implementation would store the `codeVerifier` in a temporary,
        // secure, http-only cookie during the `/api/auth/google` redirect and retrieve it here.
        // We will proceed with the non-PKCE flow which is more common for web server apps.
        
        const tokens = await oauth2Helper.getTokens(code, false); // Assuming non-PKCE flow

        if (!tokens.access_token) {
            throw new Error('No access token received from Google');
        }
        
        const userInfo = await oauth2Helper.getUserInfo(tokens.access_token);
        
        if (!userInfo.emailAddress) {
            throw new Error("Could not retrieve user's email address.");
        }

        // Use the server action to save tokens
        await saveOrUpdateTokens(userInfo.emailAddress, tokens);
        
        console.log("Successfully authenticated user:", userInfo.emailAddress);

        // Redirect user to a success page or dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error: any) {
        console.error('OAuth callback error:', error);
        
        const errorDetails = {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };

        if (error.message?.includes('invalid_grant')) {
            return NextResponse.json({ error: 'Invalid or expired authorization code. Please try again.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Authentication failed', details: errorDetails }, { status: 500 });
    }
}