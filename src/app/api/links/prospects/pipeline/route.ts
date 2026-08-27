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
            opportunities: true,
            acquiredLinks: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const pipelineClients = clients.map((client) => {
      const campaigns = client.linkCampaigns || [];
      const opps = campaigns.flatMap(c => c.opportunities || []);
      const links = campaigns.flatMap(c => c.acquiredLinks || []);
      const badge = client.name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase() || "CLI";

      const mappedCampaigns = campaigns.map(c => ({
        name: c.name,
        type: c.objective || c.description || "Link Outreach",
        prospects: c.opportunities?.length || 0
      }));

      const queue = opps.filter(o => o.status === "PROSPECT").length;
      const awaiting = opps.filter(o => o.status === "QUALIFIED").length;
      const ready = opps.filter(o => o.status === "APPROVED").length;
      const secured = links.length;

      return {
        id: client.id,
        name: client.name,
        badge,
        accent: queue > 10 ? "green" : queue > 0 ? "orange" : "gray",
        campaigns: mappedCampaigns,
        queue,
        awaiting,
        ready,
        secured,
        lastActivity: opps[0]?.discoveredAt ? new Date(opps[0].discoveredAt).toLocaleDateString("en-GB") : "Recently",
        stuckAlert: null
      };
    });

    return NextResponse.json({
      summary: {
        pipelineTotal: pipelineClients.reduce((sum, c) => sum + c.queue, 0),
        awaitingAction: pipelineClients.reduce((sum, c) => sum + c.awaiting, 0),
        readyToPitch: pipelineClients.reduce((sum, c) => sum + c.ready, 0),
        stalledClients: 0
      },
      clients: pipelineClients
    });
  } catch (error: unknown) {
    console.error("Prospect Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to load prospect pipeline" }, { status: 500 });
  }
}
