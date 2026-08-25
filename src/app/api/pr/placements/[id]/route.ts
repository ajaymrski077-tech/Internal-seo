import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logPrActivity } from "@/services/prService";
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
    const placementId = parseInt(id, 10);
    if (isNaN(placementId)) {
      return NextResponse.json({ error: "Invalid placement ID" }, { status: 400 });
    }

    const placement = await prisma.prPlacement.findUnique({
      where: { id: placementId },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!placement) {
      return NextResponse.json({ error: "Placement record not found" }, { status: 404 });
    }

    const body = await req.json();
    const { publicationName, publicationUrl, articleTitle, articleUrl, publishedDate, targetUrl, linkType, notes, verified } = body;

    const data: any = {};
    if (publicationName !== undefined) data.publicationName = publicationName.trim();
    if (publicationUrl !== undefined) data.publicationUrl = publicationUrl?.trim() || null;
    if (articleTitle !== undefined) data.articleTitle = articleTitle.trim();
    if (articleUrl !== undefined) data.articleUrl = articleUrl.trim();
    if (publishedDate !== undefined) data.publishedDate = publishedDate ? new Date(publishedDate) : null;
    if (targetUrl !== undefined) data.targetUrl = targetUrl?.trim() || null;
    if (linkType !== undefined) data.linkType = linkType;
    if (notes !== undefined) data.notes = notes || null;
    if (verified !== undefined) data.verifiedAt = verified ? new Date() : null;

    const updated = await prisma.prPlacement.update({
      where: { id: placementId },
      data,
    });

    // Log Activity
    await logPrActivity(
      user.email,
      "PR_PLACEMENT_UPDATED",
      placement.campaign.clientId,
      placement.campaign.client.name,
      { campaignId: placement.campaignId, campaignName: placement.campaign.campaignName, placementId: placement.id, publicationName: updated.publicationName }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PR Placement update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update placement record" }, { status: 500 });
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
    const placementId = parseInt(id, 10);
    if (isNaN(placementId)) {
      return NextResponse.json({ error: "Invalid placement ID" }, { status: 400 });
    }

    const placement = await prisma.prPlacement.findUnique({
      where: { id: placementId },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!placement) {
      return NextResponse.json({ error: "Placement record not found" }, { status: 404 });
    }

    await prisma.prPlacement.delete({
      where: { id: placementId },
    });

    // Log Activity
    await logPrActivity(
      user.email,
      "PR_PLACEMENT_DELETED",
      placement.campaign.clientId,
      placement.campaign.client.name,
      { campaignId: placement.campaignId, campaignName: placement.campaign.campaignName, placementId: placement.id, publicationName: placement.publicationName }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PR Placement delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete placement record" }, { status: 500 });
  }
}
