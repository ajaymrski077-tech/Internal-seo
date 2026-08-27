import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        linkCampaigns: {
          include: {
            opportunities: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const repliesToActions: Array<{ id: string; name: string; repliesCount: number }> = [];
    const needsStrategy: Array<{ id: string; name: string }> = [];
    const needsCampaign: Array<{ id: string; name: string }> = [];
    const stalled: Array<{ id: string; name: string }> = [];
    const inMotion: Array<{ id: string; name: string }> = [];
    const onTrack: Array<{ id: string; name: string }> = [];

    clients.forEach((client) => {
      const campaigns = client.linkCampaigns || [];
      const opps = campaigns.flatMap(c => c.opportunities || []);
      const repliedCount = opps.filter(o => o.status === "CONTACTED" || o.status === "FOLLOW_UP").length;

      if (repliedCount > 0) {
        repliesToActions.push({
          id: client.id,
          name: client.name,
          repliesCount: repliedCount
        });
      }

      if (campaigns.length === 0) {
        needsCampaign.push({ id: client.id, name: client.name });
      } else if (!campaigns.some(c => c.status === "ACTIVE")) {
        needsStrategy.push({ id: client.id, name: client.name });
      } else {
        const activeCount = opps.filter(o => o.status === "PROSPECT" || o.status === "QUALIFIED" || o.status === "APPROVED").length;
        if (activeCount > 0) {
          inMotion.push({ id: client.id, name: client.name });
        } else {
          onTrack.push({ id: client.id, name: client.name });
        }
      }
    });

    return NextResponse.json({
      repliesToActions,
      needsStrategy,
      needsCampaign,
      stalled,
      behindGoal: [],
      inMotion,
      onTrack
    });
  } catch (error: unknown) {
    console.error("Action Queue Error:", error);
    return NextResponse.json({ error: "Failed to load action queue" }, { status: 500 });
  }
}
