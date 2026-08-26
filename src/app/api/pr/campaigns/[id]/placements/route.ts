import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logPrActivity } from "@/services/prService";
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

    const placements = await prisma.prPlacement.findMany({
      where: { campaignId: id },
      orderBy: { publishedDate: "desc" },
    });

    return NextResponse.json({ placements });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Placements list error:", error);
    return NextResponse.json({ error: "Failed to fetch placements" }, { status: 500 });
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

    const campaign = await prisma.prCampaign.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const { publicationName, publicationUrl, articleTitle, articleUrl, publishedDate, targetUrl, linkType, notes, outreachId } = body;

    if (!publicationName || !publicationName.trim()) {
      return NextResponse.json({ error: "Publication name is required." }, { status: 400 });
    }
    if (!articleTitle || !articleTitle.trim()) {
      return NextResponse.json({ error: "Article title is required." }, { status: 400 });
    }
    if (!articleUrl || !articleUrl.trim()) {
      return NextResponse.json({ error: "Article URL is required." }, { status: 400 });
    }

    const placement = await prisma.prPlacement.create({
      data: {
        campaignId: id,
        outreachId: outreachId ? outreachId.toString() : null,
        publicationName: publicationName.trim(),
        publicationUrl: publicationUrl?.trim() || null,
        articleTitle: articleTitle.trim(),
        articleUrl: articleUrl.trim(),
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        targetUrl: targetUrl?.trim() || null,
        linkType: linkType || "UNKNOWN",
        notes: notes || null,
        verifiedAt: null,
      }
    });

    // Log Activity
    await logPrActivity(
      user.email,
      "PR_PLACEMENT_ADDED",
      campaign.clientId,
      campaign.client?.name || "Client",
      { campaignId: id, campaignName: campaign.campaignName, placementId: placement.id, publicationName: placement.publicationName, articleTitle: placement.articleTitle }
    );

    return NextResponse.json(placement, { status: 201 });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Placement create error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to create placement record" }, { status: 500 });
  }
}
