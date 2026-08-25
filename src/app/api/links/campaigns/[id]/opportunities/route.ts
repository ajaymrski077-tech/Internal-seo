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

    const opportunities = await prisma.linkOpportunity.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    console.error("Link Opportunities list error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities list" }, { status: 500 });
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
    const { domain, websiteName, websiteUrl, contactName, contactEmail, sourceType, relevance, authorityMetric, authoritySource, targetPage, proposedAnchorText, status, notes, followUpDate } = body;

    if (!domain || !domain.trim()) {
      return NextResponse.json({ error: "Domain is required." }, { status: 400 });
    }
    if (!websiteName || !websiteName.trim()) {
      return NextResponse.json({ error: "Website name is required." }, { status: 400 });
    }
    if (!websiteUrl || !websiteUrl.trim()) {
      return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
    }

    const opportunity = await prisma.linkOpportunity.create({
      data: {
        campaignId: id,
        domain: domain.trim().toLowerCase(),
        websiteName: websiteName.trim(),
        websiteUrl: websiteUrl.trim(),
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        sourceType: sourceType || "MANUAL",
        relevance: relevance || null,
        authorityMetric: authorityMetric ? parseInt(authorityMetric, 10) : null,
        authoritySource: authoritySource || "MANUAL",
        targetPage: targetPage || null,
        proposedAnchorText: proposedAnchorText || null,
        status: status || "PROSPECT",
        notes: notes || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        contactedAt: status !== "PROSPECT" && status !== "QUALIFIED" ? new Date() : null,
      }
    });

    // Log Activity
    await logLinkActivity(
      user.email,
      "LINK_OPPORTUNITY_CREATED",
      campaign.clientId,
      campaign.client.name,
      { campaignId: id, campaignName: campaign.name, opportunityId: opportunity.id, websiteName: opportunity.websiteName }
    );

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error: any) {
    console.error("Link Opportunity create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create link opportunity" }, { status: 500 });
  }
}
