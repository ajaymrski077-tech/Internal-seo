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
        properties: true,
        linkCampaigns: {
          include: {
            opportunities: true,
            acquiredLinks: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const formatted = clients.map((client) => {
      const primaryProperty = client.properties?.[0];
      const campaigns = client.linkCampaigns || [];
      const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE");
      
      let totalOpportunities = 0;
      let totalAcquiredLinks = 0;
      let totalContacted = 0;

      campaigns.forEach(c => {
        totalOpportunities += c.opportunities?.length || 0;
        totalAcquiredLinks += c.acquiredLinks?.length || 0;
        totalContacted += c.opportunities?.filter(o => o.status === "CONTACTED" || o.status === "FOLLOW_UP" || o.status === "ACQUIRED")?.length || 0;
      });

      const replyRate = totalContacted > 0 ? `${Math.round((totalAcquiredLinks / totalContacted) * 100)}%` : "0%";

      return {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain ? (primaryProperty.domain.startsWith("http") ? primaryProperty.domain : `https://${primaryProperty.domain}`) : `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        hasCampaigns: campaigns.length > 0,
        activeCount: activeCampaigns.length,
        campaignsCount: campaigns.length,
        repliesCount: totalContacted,
        linksCount: totalAcquiredLinks,
        sentTotal: totalOpportunities,
        sent30d: totalContacted,
        replyRate,
        unreadReplies: 0
      };
    });

    return NextResponse.json({ clients: formatted });
  } catch (error: unknown) {
    console.error("Campaigns Overview Error:", error);
    return NextResponse.json({ error: "Failed to load campaigns overview" }, { status: 500 });
  }
}
