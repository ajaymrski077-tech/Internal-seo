import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { verifyAcquiredBacklink, logLinkActivity } from "@/services/linkBuildingService";
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
    const backlinkId = parseInt(id, 10);
    if (isNaN(backlinkId)) {
      return NextResponse.json({ error: "Invalid backlink ID" }, { status: 400 });
    }

    const backlink = await prisma.acquiredBacklink.findUnique({
      where: { id: backlinkId },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!backlink) {
      return NextResponse.json({ error: "Backlink not found" }, { status: 404 });
    }

    const result = await verifyAcquiredBacklink(backlinkId);

    // Log Activity
    if (result.status === "LIVE") {
      await logLinkActivity(
        user.email,
        "LINK_BACKLINK_VERIFIED",
        backlink.campaign.clientId,
        backlink.campaign.client.name,
        { campaignId: backlink.campaignId, campaignName: backlink.campaign.name, backlinkId: backlink.id, sourceDomain: backlink.sourceDomain, status: "LIVE" }
      );
    } else {
      await logLinkActivity(
        user.email,
        "LINK_BACKLINK_VERIFICATION_FAILED",
        backlink.campaign.clientId,
        backlink.campaign.client.name,
        { campaignId: backlink.campaignId, campaignName: backlink.campaign.name, backlinkId: backlink.id, sourceDomain: backlink.sourceDomain, status: result.status, error: (result as any).error || "No link found matching domain" }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Backlink verification trigger error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute link verification" }, { status: 500 });
  }
}
