import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

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
    const locationId = parseInt(id, 10);
    if (isNaN(locationId)) {
      return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
    }

    const loc = await prisma.gbpLocation.findUnique({
      where: { id: locationId },
      include: {
        property: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    });

    if (!loc) {
      return NextResponse.json({ error: "GBP location not found" }, { status: 404 });
    }

    // Delete location mappings (cascade deletes snapshots automatically)
    await prisma.$transaction(async (tx) => {
      await tx.gbpLocation.delete({ where: { id: locationId } });

      // Clean GbpConnection externalId
      await tx.integrationConnection.updateMany({
        where: { propertyId: loc.propertyId, provider: "GBP" },
        data: { externalId: null }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          actorEmail: user.email,
          action: "GBP_LOCATION_DISCONNECTED",
          clientId: loc.property.client.id,
          clientName: loc.property.client.name,
          metadata: JSON.stringify({ displayName: loc.displayName }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Disconnect GBP Location Error:", error);
    return NextResponse.json({ error: "Failed to disconnect GBP location" }, { status: 500 });
  }
}
