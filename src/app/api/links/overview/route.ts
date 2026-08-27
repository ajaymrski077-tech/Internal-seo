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

    const [clients, allAcquired] = await Promise.all([
      prisma.client.findMany({
        include: {
          linkCampaigns: {
            include: {
              opportunities: true,
              acquiredLinks: true
            }
          }
        },
        orderBy: { name: "asc" }
      }),
      prisma.acquiredBacklink.findMany({
        orderBy: { acquiredDate: "desc" }
      })
    ]);

    let totalBuilt = allAcquired.length;
    let editorialBuilt = allAcquired.filter(l => l.linkType?.toLowerCase().includes("editorial") || l.linkType?.toLowerCase().includes("guest")).length;
    let directoryBuilt = allAcquired.filter(l => l.linkType?.toLowerCase().includes("directory") || l.linkType?.toLowerCase().includes("citation") || l.linkType?.toLowerCase().includes("nap")).length;

    const clientPlans = clients.map((client) => {
      const campaigns = client.linkCampaigns || [];
      const opps = campaigns.flatMap(c => c.opportunities || []);
      const links = campaigns.flatMap(c => c.acquiredLinks || []);
      
      const code = client.name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase() || "CLI";

      return {
        id: client.id,
        code,
        name: client.name,
        hasPlan: campaigns.some(c => c.status === "ACTIVE"),
        monthlyTarget: campaigns[0]?.monthlyTarget || null,
        emails: opps.filter(o => o.status === "CONTACTED" || o.status === "FOLLOW_UP").length,
        queue: opps.filter(o => o.status === "PROSPECT").length,
        awaiting: opps.filter(o => o.status === "QUALIFIED").length,
        ready: opps.filter(o => o.status === "APPROVED").length,
        campaignsCount: campaigns.length,
      };
    });

    // Compute monthly velocity from real backlinks
    const monthlyGroups: Record<string, number> = {};
    allAcquired.forEach((link) => {
      const monthStr = new Date(link.acquiredDate).toISOString().slice(0, 7);
      monthlyGroups[monthStr] = (monthlyGroups[monthStr] || 0) + 1;
    });

    const velocityChart = Object.entries(monthlyGroups).map(([month, count]) => ({
      month,
      count
    }));

    return NextResponse.json({
      summary: {
        totalBuilt,
        totalPlanned: clientPlans.reduce((sum, c) => sum + (c.monthlyTarget || 0), 0),
        editorial: { built: editorialBuilt, planned: null },
        directory: { built: directoryBuilt, planned: null },
      },
      velocityChart,
      clientPlans,
      otherClientsCount: 0,
      recentActivity: []
    });
  } catch (error: unknown) {
    console.error("Link Overview Error:", error);
    return NextResponse.json({ error: "Failed to load link overview" }, { status: 500 });
  }
}
