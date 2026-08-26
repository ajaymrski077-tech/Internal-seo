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
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid backlink ID" }, { status: 400 });
    }

    const backlink = await prisma.acquiredBacklink.findUnique({
      where: { id },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!backlink) {
      return NextResponse.json({ error: "Backlink not found" }, { status: 404 });
    }

    const result = await verifyAcquiredBacklink(id);

    // Log Activity
    if (result.status === "LIVE") {
      await logLinkActivity(
        user.email,
        "LINK_BACKLINK_VERIFIED",
        backlink.campaign?.clientId || "",
        backlink.campaign?.client?.name || "Client",
        { campaignId: backlink.campaignId, campaignName: backlink.campaign?.name || "", backlinkId: backlink.id, sourceDomain: backlink.sourceDomain, status: "LIVE" }
      );
    } else {
      await logLinkActivity(
        user.email,
        "LINK_BACKLINK_VERIFICATION_FAILED",
        backlink.campaign?.clientId || "",
        backlink.campaign?.client?.name || "Client",
        { campaignId: backlink.campaignId, campaignName: backlink.campaign?.name || "", backlinkId: backlink.id, sourceDomain: backlink.sourceDomain, status: result.status, error: result.error || "No link found matching domain" }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Backlink verification trigger error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to execute link verification" }, { status: 500 });
  }
}
