import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getGoogleTokens } from "@/services/googleApiService";
import { syncPropertyData } from "@/services/analyticsService";
import { encryptToken, decryptToken } from "@/services/tokenEncryptionService";
import prisma from "@/lib/db";

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
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state"); // This is the nonce from Google
    const errorParam = searchParams.get("error");

    if (errorParam) {
      console.error("OAuth Error from Google:", errorParam);
      return NextResponse.json({ error: `Google OAuth Error: ${errorParam}` }, { status: 400 });
    }

    if (!code || !stateParam) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // 2. Read and validate oauth_state cookie
    const cookieState = req.cookies.get("oauth_state")?.value;
    if (!cookieState) {
      return NextResponse.json({ error: "Missing state session. Please try connecting again." }, { status: 400 });
    }

    let stateObj;
    try {
      stateObj = JSON.parse(decryptToken(cookieState));
    } catch (err) {
      return NextResponse.json({ error: "Invalid or corrupted state session" }, { status: 400 });
    }

    const { nonce, clientId, provider, externalId, expiry } = stateObj;

    // Validate nonce and expiry
    if (nonce !== stateParam) {
      return NextResponse.json({ error: "State validation failed (CSRF check failed)" }, { status: 400 });
    }

    if (!expiry || Date.now() > expiry) {
      return NextResponse.json({ error: "State session expired. Please try connecting again." }, { status: 400 });
    }

    if (!clientId || !provider) {
      return NextResponse.json({ error: "Invalid state metadata" }, { status: 400 });
    }

    // 3. Exchange code for tokens
    const tokens = await getGoogleTokens(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    // 4. Update database
    const property = await prisma.websiteProperty.findFirst({
      where: { clientId: clientId.toString() },
    });

    if (!property) {
      return NextResponse.json({ error: "No website property registered for client" }, { status: 404 });
    }

    const clientRecord = await prisma.client.findUnique({
      where: { id: clientId.toString() }
    });

    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.integrationConnection.findFirst({
        where: { propertyId: property.id, provider },
      });

      let conn;
      if (existing) {
        conn = await tx.integrationConnection.update({
          where: { id: existing.id },
          data: {
            externalId: externalId || existing.externalId,
            status: "CONNECTED",
            accessToken: access_token ? encryptToken(access_token) : null,
            // Only overwrite refresh token if we get a new one
            ...(refresh_token && { refreshToken: encryptToken(refresh_token) }),
            tokenExpiry: expiry_date ? new Date(expiry_date) : null,
            lastSyncTime: new Date(),
            syncStatus: "SUCCESS",
            syncError: null,
          },
        });
      } else {
        conn = await tx.integrationConnection.create({
          data: {
            propertyId: property.id,
            provider,
            externalId: externalId || "",
            status: "CONNECTED",
            accessToken: access_token ? encryptToken(access_token) : null,
            refreshToken: refresh_token ? encryptToken(refresh_token) : null,
            tokenExpiry: expiry_date ? new Date(expiry_date) : null,
            lastSyncTime: new Date(),
            syncStatus: "SUCCESS",
          },
        });
      }

      // If provider is GA4 or GSC, also share tokens with sibling provider if it exists
      if (provider === "GA4" || provider === "GSC") {
        const siblingProvider = provider === "GA4" ? "GSC" : "GA4";
        const sibling = await tx.integrationConnection.findFirst({
          where: { propertyId: property.id, provider: siblingProvider },
        });
        if (sibling && (!sibling.accessToken || sibling.status === "DISCONNECTED")) {
          await tx.integrationConnection.update({
            where: { id: sibling.id },
            data: {
              status: "CONNECTED",
              accessToken: access_token ? encryptToken(access_token) : null,
              ...(refresh_token && { refreshToken: encryptToken(refresh_token) }),
              tokenExpiry: expiry_date ? new Date(expiry_date) : null,
              lastSyncTime: new Date(),
              syncStatus: "SUCCESS",
              syncError: null,
            }
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          actorEmail: user.email,
          action: "INTEGRATION_CONNECTED",
          clientId: clientRecord.id,
          clientName: clientRecord.name,
          metadata: JSON.stringify({ provider, status: conn.status }),
        },
      });
    });

    // 4.5. Trigger initial data sync asynchronously (don't block the redirect)
    if (provider !== "GBP") {
      syncPropertyData(property.id).catch((err) => {
        console.error("Initial Google API Sync Failed:", err);
      });
    }

    // 5. Redirect back to client page and clear state cookie
    const response = NextResponse.redirect(new URL(`/admin/clients/${clientId}`, req.url));
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return response;

  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Google Auth Callback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
