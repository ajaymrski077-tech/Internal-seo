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
    if (!id || id.trim() === "" || id === "invalid") {
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
      where: { clientId: id },
    });

    if (!property) {
      return NextResponse.json({ error: "No website property registered for client" }, { status: 404 });
    }

    // Get client details to construct logs
    const clientRecord = await prisma.client.findUnique({
      where: { id }
    });
    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 1. Fetch existing connection to validate tokens
    const existing = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider },
    });

    if (!existing || !existing.accessToken) {
      return NextResponse.json({
        error: "Google account is not authenticated for this client. Please authenticate via OAuth first."
      }, { status: 400 });
    }

    // 2. Validate externalId against available properties from Google API
    if (status !== "PAUSED") {
      if (provider === "GA4") {
        const available = await listGa4Properties(existing.id);
        const valid = available.some(p => p.propertyId === trimmedExternalId);
        if (!valid) {
          return NextResponse.json({
            error: "Selected GA4 Property ID was not found in your Google Analytics account."
          }, { status: 400 });
        }
      } else if (provider === "GSC") {
        const available = await listGscSites(existing.id);
        const valid = available.some(s => s.siteUrl === trimmedExternalId);
        if (!valid) {
          return NextResponse.json({
            error: "Selected Google Search Console Site was not found in your GSC account."
          }, { status: 400 });
        }
      }
    }

    // 3. Upsert integration connection
    const connection = await prisma.integrationConnection.update({
      where: { id: existing.id },
      data: {
        externalId: trimmedExternalId,
        status: status || "CONNECTED",
        conversionEventName: provider === "GA4" ? (conversionEventName ? conversionEventName.trim() : null) : null,
        syncStatus: "SUCCESS",
        syncError: null,
      },
    });

    // 4. Trigger initial data sync synchronously on setup if connected
    if (connection.status === "CONNECTED") {
      try {
        await syncPropertyData(property.id);
      } catch (syncError: any) {
        console.error("Initial data sync failed:", syncError);
        // Do not fail the whole request, but update connection status
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: {
            syncStatus: "ERROR",
            syncError: syncError.message || "Failed initial data sync",
          },
        });
      }
    }

    // 5. Log activity
    await prisma.activityLog.create({
      data: {
        actorEmail: user.email,
        action: "INTEGRATION_CONNECTED",
        clientId: id,
        clientName: clientRecord.name,
        metadata: JSON.stringify({
          provider,
          externalId: trimmedExternalId,
          status: connection.status
        }),
      },
    });

    // Refresh connection to return final syncStatus
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
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    if (!provider || !["GA4", "GSC"].includes(provider)) {
      return NextResponse.json({ error: "Provider must be GA4 or GSC" }, { status: 400 });
    }

    const property = await prisma.websiteProperty.findFirst({
      where: { clientId: id },
    });

    if (!property) {
      return NextResponse.json({ error: "No website property registered for client" }, { status: 404 });
    }

    const clientRecord = await prisma.client.findUnique({
      where: { id }
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
          clientId: id,
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
