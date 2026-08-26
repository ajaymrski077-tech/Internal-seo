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
      return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
    }

    const opportunity = await prisma.linkOpportunity.findUnique({
      where: { id },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const body = await req.json();
    const { domain, websiteName, websiteUrl, contactName, contactEmail, sourceType, relevance, authorityMetric, status, notes, followUpDate } = body;

    const data: Record<string, unknown> = {};
    if (domain !== undefined) data.domain = domain.trim().toLowerCase();
    if (websiteName !== undefined) data.websiteName = websiteName.trim();
    if (websiteUrl !== undefined) data.websiteUrl = websiteUrl.trim();
    if (contactName !== undefined) data.contactName = contactName || null;
    if (contactEmail !== undefined) data.contactEmail = contactEmail || null;
    if (sourceType !== undefined) data.sourceType = sourceType;
    if (relevance !== undefined) data.relevance = relevance || null;
    if (authorityMetric !== undefined) data.authorityMetric = authorityMetric ? parseInt(authorityMetric, 10) : null;
    if (status !== undefined) {
      data.status = status.toUpperCase();
      if (status !== "PROSPECT" && status !== "QUALIFIED" && !opportunity.contactedAt) {
        data.contactedAt = new Date();
      }
    }
    if (notes !== undefined) data.notes = notes || null;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;

    const updated = await prisma.linkOpportunity.update({
      where: { id },
      data,
    });

    // Log Activity
    if (status && status.toUpperCase() !== opportunity.status) {
      await logLinkActivity(
        user.email,
        "LINK_OPPORTUNITY_STATUS_CHANGED",
        opportunity.campaign.clientId,
        opportunity.campaign.client.name,
        {
          campaignId: opportunity.campaignId,
          campaignName: opportunity.campaign.name,
          opportunityId: opportunity.id,
          websiteName: opportunity.websiteName,
          oldStatus: opportunity.status,
          newStatus: status.toUpperCase()
        }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Link Opportunity update error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to update opportunity" }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
    }

    const opportunity = await prisma.linkOpportunity.findUnique({
      where: { id },
      include: {
        campaign: { include: { client: true } }
      }
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    await prisma.linkOpportunity.delete({
      where: { id },
    });

    // Log Activity
    await logLinkActivity(
      user.email,
      "LINK_OPPORTUNITY_DELETED",
      opportunity.campaign.clientId,
      opportunity.campaign.client.name,
      { campaignId: opportunity.campaignId, campaignName: opportunity.campaign.name, opportunityId: opportunity.id, websiteName: opportunity.websiteName }
    );

    return NextResponse.json({ success: true });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Link Opportunity delete error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to delete opportunity" }, { status: 500 });
  }
}
