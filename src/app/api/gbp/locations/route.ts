import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const locations = await prisma.gbpLocation.findMany({
      include: {
        property: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { displayName: "asc" },
    });

    const formatted = locations.map((loc: any) => ({
      id: loc.id,
      locationName: loc.locationName,
      displayName: loc.displayName,
      address: loc.address,
      phone: loc.phone,
      websiteUri: loc.websiteUri,
      primaryCategory: loc.primaryCategory,
      syncStatus: loc.syncStatus,
      syncError: loc.syncError,
      lastSyncTime: loc.lastSyncTime?.toISOString?.() || null,
      clientId: loc.property?.client?.id || null,
      clientName: loc.property?.client?.name || "Client",
      domain: loc.property?.domain || "Domain",
    }));

    return NextResponse.json({ locations: formatted });
  } catch (error: any) {
    console.error("List GBP Locations error:", error);
    return NextResponse.json({ error: "Failed to list GMB locations" }, { status: 500 });
  }
}
