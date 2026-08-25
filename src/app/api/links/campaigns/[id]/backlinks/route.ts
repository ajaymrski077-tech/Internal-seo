import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logLinkActivity } from "@/services/linkBuildingService";
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
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const backlinks = await prisma.acquiredBacklink.findMany({
      where: { campaignId: id },
      include: { opportunity: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ backlinks });
  } catch (error: any) {
    console.error("Link Backlinks list error:", error);
    return NextResponse.json({ error: "Failed to fetch backlinks list" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.linkCampaign.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const { sourceDomain, sourceUrl, targetUrl, anchorText, linkType, notes, opportunityId, acquiredDate } = body;

    if (!sourceDomain || !sourceDomain.trim()) {
      return NextResponse.json({ error: "Source Domain is required." }, { status: 400 });
    }
    if (!sourceUrl || !sourceUrl.trim()) {
      return NextResponse.json({ error: "Source URL is required." }, { status: 400 });
    }
    if (!targetUrl || !targetUrl.trim()) {
      return NextResponse.json({ error: "Target URL is required." }, { status: 400 });
    }
    if (!anchorText || !anchorText.trim()) {
      return NextResponse.json({ error: "Anchor text is required." }, { status: 400 });
    }

    const backlink = await prisma.acquiredBacklink.create({
      data: {
        campaignId: id,
        opportunityId: opportunityId ? opportunityId.toString() : null,
        sourceDomain: sourceDomain.trim().toLowerCase(),
        sourceUrl: sourceUrl.trim(),
        targetUrl: targetUrl.trim(),
        anchorText: anchorText.trim(),
        linkType: linkType || "UNKNOWN",
        status: "PENDING_VERIFICATION",
        notes: notes || null,
        acquiredDate: acquiredDate ? new Date(acquiredDate) : new Date(),
      }
    });

    // Log Activity
    await logLinkActivity(
      user.email,
      "LINK_BACKLINK_CREATED",
      campaign.clientId,
      campaign.client.name,
      { campaignId: id, campaignName: campaign.name, backlinkId: backlink.id, sourceDomain: backlink.sourceDomain }
    );

    return NextResponse.json(backlink, { status: 201 });
  } catch (error: any) {
    console.error("Link Backlink create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create backlink record" }, { status: 500 });
  }
}
