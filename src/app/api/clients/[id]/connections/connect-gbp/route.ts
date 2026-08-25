import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { syncGbpData } from "@/services/gbpSyncService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const body = await req.json();
    const { locationName, accountName, displayName, primaryCategory, address, phone, websiteUri } = body;

    if (!locationName || !accountName || !displayName) {
      return NextResponse.json({ error: "Missing required location details" }, { status: 400 });
    }

    const property = await prisma.websiteProperty.findFirst({
      where: { clientId: id },
    });

    if (!property) {
      return NextResponse.json({ error: "No property configured for client" }, { status: 404 });
    }

    const connection = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider: "GBP" },
    });

    if (!connection) {
      return NextResponse.json({ error: "GBP integration connection not found" }, { status: 404 });
    }

    // 1. Upsert GbpLocation mapping
    const gbpLocation = await prisma.gbpLocation.upsert({
      where: { propertyId: property.id },
      update: {
        connectionId: connection.id,
        locationName,
        accountName,
        displayName,
        primaryCategory: primaryCategory || null,
        address: address || null,
        phone: phone || null,
        websiteUri: websiteUri || null,
        syncStatus: "CONNECTED",
        syncError: null,
      },
      create: {
        propertyId: property.id,
        connectionId: connection.id,
        locationName,
        accountName,
        displayName,
        primaryCategory: primaryCategory || null,
        address: address || null,
        phone: phone || null,
        websiteUri: websiteUri || null,
        syncStatus: "CONNECTED",
      },
    });

    // 2. Set the location name in GbpConnection externalId for tracking
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        externalId: displayName,
      },
    });

    // 3. Log activity
    const clientRecord = await prisma.client.findUnique({ where: { id: clientId } });
    await prisma.activityLog.create({
      data: {
        actorEmail: user.email,
        action: "GBP_LOCATION_CONNECTED",
        clientId,
        clientName: clientRecord?.name || "Unknown",
        metadata: JSON.stringify({ displayName, locationName }),
      },
    });

    // 4. Trigger initial data sync for last 90 days asynchronously
    syncGbpData(gbpLocation.id, 90).catch((err) => {
      console.error(`[GBP] Background GMB initial sync failed for Location ID ${gbpLocation.id}:`, err);
    });

    return NextResponse.json({ success: true, location: gbpLocation });
  } catch (error: any) {
    console.error("Connect GBP Location Error:", error);
    return NextResponse.json({ error: error.message || "Failed to connect GBP location" }, { status: 500 });
  }
}
