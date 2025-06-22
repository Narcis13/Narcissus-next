import { GoogleOAuth2Helper } from "@/lib/helpers/google-oauth2-helper";
import { NextRequest, NextResponse } from "next/server";

// This forces the route to be dynamic, preventing it from being cached
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const usePKCE = request.nextUrl.searchParams.get('pkce') === 'true';

    // IMPORTANT: Instantiate the helper here, inside the request handler.
    // This is crucial for serverless environments to avoid state pollution (like the codeVerifier)
    // between different user requests.
    const oauth2Helper = new GoogleOAuth2Helper(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
    );
    
    const authUrl = oauth2Helper.getAuthUrl(usePKCE);
    
    // In a real app, you would need to store the `codeVerifier` in a short-lived,
    // secure, HTTP-only cookie to retrieve it in the callback. For simplicity,
    // this example relies on the helper instance being fresh, which is NOT robust
    // for PKCE flows across different serverless function invocations.
    // The non-PKCE flow is more reliable in a stateless setup without session management.

    return NextResponse.redirect(authUrl);
}