import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCampaigns, logPrActivity } from "@/services/prService";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const clientIdStr = searchParams.get("clientId");
    const clientId = clientIdStr && clientIdStr !== "All" ? clientIdStr : undefined;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;

    const campaigns = await getCampaigns({ search, clientId, status, priority });
    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("PR Campaigns list error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignName, clientId, description, objective, status, priority, startDate, targetDate, budget } = body;

    if (!campaignName || !campaignName.trim()) {
      return NextResponse.json({ error: "Campaign name is required." }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ error: "Client assignment is required." }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    const campaign = await prisma.prCampaign.create({
      data: {
        campaignName: campaignName.trim(),
        clientId: clientId.toString(),
        description: description || null,
        objective: objective || null,
        status: status || "DRAFT",
        priority: priority || "NORMAL",
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        budget: budget ? parseFloat(budget) : null,
      },
      include: {
        client: { select: { name: true } }
      }
    });

    // Log activity
    await logPrActivity(
      user.email,
      "PR_CAMPAIGN_CREATED",
      client.id,
      client.name,
      { campaignId: campaign.id, campaignName: campaign.campaignName }
    );

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error("PR Campaign create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 });
  }
}
