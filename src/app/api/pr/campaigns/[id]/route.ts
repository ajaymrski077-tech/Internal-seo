import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCampaignDetail, logPrActivity } from "@/services/prService";
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
    console.error("PR Campaign detail load error:", error);
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

    const campaign = await prisma.prCampaign.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const { campaignName, description, objective, status, priority, startDate, targetDate, completedDate, budget } = body;

    const data: Record<string, unknown> = {};
    if (campaignName !== undefined) data.campaignName = campaignName.trim();
    if (description !== undefined) data.description = description || null;
    if (objective !== undefined) data.objective = objective || null;
    if (status !== undefined) data.status = status.toUpperCase();
    if (priority !== undefined) data.priority = priority.toUpperCase();
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
    if (completedDate !== undefined) data.completedDate = completedDate ? new Date(completedDate) : null;
    if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;

    const updated = await prisma.prCampaign.update({
      where: { id },
      data,
    });

    // Log activity if status or critical field changed
    if (status && status.toUpperCase() !== campaign.status) {
      await logPrActivity(
        user.email,
        "PR_CAMPAIGN_STATUS_CHANGED",
        campaign.clientId,
        campaign.client?.name || "Client",
        { campaignId: campaign.id, campaignName: campaign.campaignName, oldStatus: campaign.status, newStatus: status.toUpperCase() }
      );
    } else {
      await logPrActivity(
        user.email,
        "PR_CAMPAIGN_UPDATED",
        campaign.clientId,
        campaign.client?.name || "Client",
        { campaignId: campaign.id, campaignName: campaign.campaignName }
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Campaign update error:", error);
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

    const campaign = await prisma.prCampaign.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await prisma.prCampaign.delete({
      where: { id },
    });

    // Log activity
    await logPrActivity(
      user.email,
      "PR_CAMPAIGN_DELETED",
      campaign.clientId,
      campaign.client?.name || "Client",
      { campaignId: campaign.id, campaignName: campaign.campaignName }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("PR Campaign delete error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to delete campaign" }, { status: 500 });
  }
}
