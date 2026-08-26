import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCampaignDetail, logLinkActivity } from "@/services/linkBuildingService";
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

    const campaign = await getCampaignDetail(id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Link Campaign load error:", error);
    return NextResponse.json({ error: "Failed to load campaign detail" }, { status: 500 });
  }
}

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
    const { name, description, objective, status, priority, startDate, targetDate, completedDate, monthlyTarget } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description || null;
    if (objective !== undefined) data.objective = objective || null;
    if (status !== undefined) data.status = status.toUpperCase();
    if (priority !== undefined) data.priority = priority.toUpperCase();
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
    if (completedDate !== undefined) data.completedDate = completedDate ? new Date(completedDate) : null;
    if (monthlyTarget !== undefined) data.monthlyTarget = monthlyTarget ? parseInt(monthlyTarget, 10) : null;

    const updated = await prisma.linkCampaign.update({
      where: { id },
      data,
    });

    // Log Activity
    if (status && status.toUpperCase() !== campaign.status) {
      await logLinkActivity(
        user.email,
        "LINK_CAMPAIGN_STATUS_CHANGED",
        campaign.clientId,
        campaign.client?.name || "Client",
        { campaignId: campaign.id, campaignName: campaign.name, oldStatus: campaign.status, newStatus: status.toUpperCase() }
      );
    } else {
      await logLinkActivity(
        user.email,
        "LINK_CAMPAIGN_UPDATED",
        campaign.clientId,
        campaign.client?.name || "Client",
        { campaignId: campaign.id, campaignName: campaign.name }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Link Campaign update error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to update campaign" }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.linkCampaign.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await prisma.linkCampaign.delete({
      where: { id },
    });

    // Log activity
    await logLinkActivity(
      user.email,
      "LINK_CAMPAIGN_DELETED",
      campaign.clientId,
      campaign.client?.name || "Client",
      { campaignId: campaign.id, campaignName: campaign.name }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Link Campaign delete error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to delete campaign" }, { status: 500 });
  }
}
