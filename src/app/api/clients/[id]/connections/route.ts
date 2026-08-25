import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { listGa4Properties, listGscSites } from "@/services/googleApiService";
import { syncPropertyData } from "@/services/analyticsService";

// POST: Add or update an integration connection
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const body = await req.json();
    const { provider, externalId, status, conversionEventName } = body;

    if (!provider || !["GA4", "GSC"].includes(provider)) {
      return NextResponse.json({ error: "Provider must be GA4 or GSC" }, { status: 400 });
    }

    if (!externalId || !externalId.trim()) {
      return NextResponse.json({ error: "Property ID / Site URL is required." }, { status: 400 });
    }

    const trimmedExternalId = externalId.trim();

    // Get client's primary property
    const property = await prisma.websiteProperty.findFirst({
      where: { clientId },
    });

    if (!property) {
      return NextResponse.json({ error: "No website property registered for client" }, { status: 404 });
    }

    // Get client details to construct logs
    const clientRecord = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 1. Fetch existing connection to validate tokens
    const existing = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider },
    });

    if (!existing) {
      return NextResponse.json({ error: `Please connect your Google account for ${provider} first.` }, { status: 400 });
    }

    // 2. Perform Server-side Validation
    if (provider === "GA4") {
      if (!/^\d+$/.test(trimmedExternalId)) {
        return NextResponse.json({ error: "Invalid GA4 Property ID. It must be numeric." }, { status: 400 });
      }

      try {
        const properties = await listGa4Properties(existing.id);
        const hasAccess = properties.some((p) => p.propertyId === trimmedExternalId);
        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied. Your connected Google account does not have access to this GA4 property." }, { status: 403 });
        }
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to validate property access: ${err.message}` }, { status: 400 });
      }
    } else if (provider === "GSC") {
      if (
        !trimmedExternalId.startsWith("sc-domain:") &&
        !trimmedExternalId.startsWith("http://") &&
        !trimmedExternalId.startsWith("https://")
      ) {
        return NextResponse.json({ error: "Invalid GSC Site URL prefix or sc-domain prefix." }, { status: 400 });
      }

      try {
        const sites = await listGscSites(existing.id);
        const hasAccess = sites.some((s) => s.siteUrl === trimmedExternalId);
        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied. Your connected Google account does not have access to this GSC site." }, { status: 403 });
        }
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to validate site access: ${err.message}` }, { status: 400 });
      }
    }

    // 3. Upsert connection
    const connection = await prisma.$transaction(async (tx) => {
      const conn = await tx.integrationConnection.update({
        where: { id: existing.id },
        data: {
          externalId: trimmedExternalId,
          status: status || "CONNECTED",
          conversionEventName: conversionEventName !== undefined ? conversionEventName : existing.conversionEventName,
          lastSyncTime: new Date(),
          syncStatus: "SUCCESS",
          syncError: null,
        },
      });

      // Log activity
      await (tx as any).activityLog.create({
        data: {
          actorEmail: user.email,
          action: "INTEGRATION_CONNECTED",
          clientId,
          clientName: clientRecord.name,
          metadata: JSON.stringify({ provider, status: conn.status, externalId: trimmedExternalId }),
        },
      });

      return conn;
    });

    // 4. Run sync synchronously for this provider to confirm initial sync results
    try {
      await syncPropertyData(property.id);
    } catch (syncError: any) {
      console.error("Initial sync error:", syncError);
      // Update connection to SYNC_ERROR/FAILED but keep connection saved
      const updatedConn = await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: "SYNC_ERROR",
          syncStatus: "FAILED",
          syncError: syncError.message,
        }
      });
      const { accessToken, refreshToken, ...sanitized } = updatedConn;
      return NextResponse.json(sanitized);
    }

    // Fetch the updated connection after successful sync
    const finalConnection = await prisma.integrationConnection.findUnique({
      where: { id: connection.id }
    });

    const { accessToken, refreshToken, ...sanitized } = finalConnection || connection;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error("Failed to connect integration:", error);
    return NextResponse.json({ error: error.message || "Failed to update integration connection" }, { status: 500 });
  }
}

// DELETE: Remove an integration connection
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const clientId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    if (!provider || !["GA4", "GSC"].includes(provider)) {
      return NextResponse.json({ error: "Provider must be GA4 or GSC" }, { status: 400 });
    }

    const property = await prisma.websiteProperty.findFirst({
      where: { clientId },
    });

    if (!property) {
      return NextResponse.json({ error: "No website property registered for client" }, { status: 404 });
    }

    const clientRecord = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const existing = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider },
    });

    if (!existing) {
      return NextResponse.json({ success: true, message: "Connection already disconnected" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.integrationConnection.delete({
        where: { id: existing.id },
      });

      // Log activity
      await (tx as any).activityLog.create({
        data: {
          actorEmail: user.email,
          action: "INTEGRATION_DISCONNECTED",
          clientId,
          clientName: clientRecord.name,
          metadata: JSON.stringify({ provider }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to disconnect integration:", error);
    return NextResponse.json({ error: error.message || "Failed to delete integration connection" }, { status: 500 });
  }
}
