import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/services/googleApiService";
import crypto from "crypto";
import { encryptToken } from "@/services/tokenEncryptionService";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const provider = searchParams.get("provider"); // GA4 or GSC
    const externalId = searchParams.get("externalId") || "";

    if (!clientId || clientId.trim() === "" || clientId === "invalid") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }
    if (!provider || !["GA4", "GSC", "GBP"].includes(provider)) {
      return NextResponse.json({ error: "Provider must be GA4, GSC, or GBP" }, { status: 400 });
    }

    // 2. Define required scopes based on provider
    const scopes = [];
    if (provider === "GA4") {
      scopes.push("https://www.googleapis.com/auth/analytics.readonly");
    } else if (provider === "GSC") {
      scopes.push("https://www.googleapis.com/auth/webmasters.readonly");
    } else if (provider === "GBP") {
      scopes.push("https://www.googleapis.com/auth/business.manage");
    }

    // 3. Generate a secure random nonce and state payload
    const nonce = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    const statePayload = { nonce, clientId, provider, externalId, expiry };
    const encryptedState = encryptToken(JSON.stringify(statePayload));

    // 4. Generate URL and redirect
    const authUrl = getGoogleAuthUrl(nonce, scopes);
    
    const response = NextResponse.redirect(authUrl);
    
    // Set secure HTTP-only cookie
    response.cookies.set("oauth_state", encryptedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 300 // 5 minutes
    });

    return response;
  } catch (error: any) {
    console.error("Google Auth Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
