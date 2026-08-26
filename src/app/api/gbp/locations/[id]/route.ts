import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
    }

    const loc = await prisma.gbpLocation.findUnique({
      where: { id },
      include: {
        property: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    });

    if (!loc) {
      return NextResponse.json({ error: "GBP location not found" }, { status: 404 });
    }

    return NextResponse.json({
      location: {
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
      }
    });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Get GBP Location Detail error:", error);
    return NextResponse.json({ error: "Failed to load location details" }, { status: 500 });
  }
}
