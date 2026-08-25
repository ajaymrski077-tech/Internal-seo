import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { syncGbpData } from "@/services/gbpSyncService";
import prisma from "@/lib/db";

export async function POST(
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
    const locationId = parseInt(id, 10);
    if (isNaN(locationId)) {
      return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
    }

    const loc = await prisma.gbpLocation.findUnique({
      where: { id: locationId }
    });

    if (!loc) {
      return NextResponse.json({ error: "GBP location not found" }, { status: 404 });
    }

    // Await sync execution
    await syncGbpData(locationId, 30);

    // Refresh loc object from DB for fresh status
    const updatedLoc = await prisma.gbpLocation.findUnique({
      where: { id: locationId }
    });

    return NextResponse.json({
      success: updatedLoc?.syncStatus === "CONNECTED",
      status: updatedLoc?.syncStatus,
      error: updatedLoc?.syncError
    });
  } catch (error: any) {
    console.error("Sync GBP Location error:", error);
    return NextResponse.json({ error: "Failed to sync GBP data" }, { status: 500 });
  }
}
