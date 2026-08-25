import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logLinkActivity } from "@/services/linkBuildingService";
import prisma from "@/lib/db";

export async function PATCH(
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
      return NextResponse.json({ error: "Backlink record not found" }, { status: 404 });
    }

    const body = await req.json();
    const { sourceDomain, sourceUrl, targetUrl, anchorText, linkType, notes, status, acquiredDate } = body;

    const data: any = {};
    if (sourceDomain !== undefined) data.sourceDomain = sourceDomain.trim().toLowerCase();
    if (sourceUrl !== undefined) data.sourceUrl = sourceUrl.trim();
    if (targetUrl !== undefined) data.targetUrl = targetUrl.trim();
    if (anchorText !== undefined) data.anchorText = anchorText.trim();
    if (linkType !== undefined) data.linkType = linkType;
    if (notes !== undefined) data.notes = notes || null;
    if (status !== undefined) data.status = status;
    if (acquiredDate !== undefined) data.acquiredDate = acquiredDate ? new Date(acquiredDate) : new Date();

    const updated = await prisma.acquiredBacklink.update({
      where: { id },
      data,
    });

    // Log Activity
    await logLinkActivity(
      user.email,
      "LINK_BACKLINK_UPDATED",
      backlink.campaign.clientId,
      backlink.campaign.client.name,
      { campaignId: backlink.campaignId, campaignName: backlink.campaign.name, backlinkId: backlink.id, sourceDomain: updated.sourceDomain }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Link Backlink update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update backlink record" }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Backlink record not found" }, { status: 404 });
    }

    await prisma.acquiredBacklink.delete({
      where: { id },
    });

    // Log Activity
    await logLinkActivity(
      user.email,
      "LINK_BACKLINK_DELETED",
      backlink.campaign.clientId,
      backlink.campaign.client.name,
      { campaignId: backlink.campaignId, campaignName: backlink.campaign.name, backlinkId: backlink.id, sourceDomain: backlink.sourceDomain }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Link Backlink delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete backlink record" }, { status: 500 });
  }
}
