import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/actions/token-storage';
import { GoogleOAuth2Helper } from '@/lib/helpers/google-oauth2-helper';

// This ensures the route is treated as dynamic and not cached.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // 1. Get the email from the query parameters
    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json(
            { error: 'Email query parameter is required' },
            { status: 400 }
        );
    }

    try {
        // 2. Use the Server Action to get a valid token.
        // This action will handle checking for expiration and refreshing if necessary.
        const accessToken = await getValidAccessToken(email);

        if (!accessToken) {
            return NextResponse.json(
                { error: `Could not retrieve a valid token for ${email}. Please re-authenticate.` },
                { status: 401 } // 401 Unauthorized is a fitting status code
            );
        }

        // 3. Instantiate the helper to use its `getUserInfo` method.
        // It's safe to create it here as it's a lightweight class.
        const oauth2Helper = new GoogleOAuth2Helper(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            process.env.GOOGLE_REDIRECT_URI!
        );

        // 4. Fetch the user's profile from the Google API
        const userInfo = await oauth2Helper.getUserInfo(accessToken);

        // 5. Return the successful response
        return NextResponse.json({
            message: "Successfully fetched profile using stored token.",
            profile: userInfo,
            token: accessToken // Including the token for debugging, just like the original
        });

    } catch (error: any) {
        console.error("Error fetching gmail profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile.", details: error.message },
            { status: 500 }
        );
    }
}