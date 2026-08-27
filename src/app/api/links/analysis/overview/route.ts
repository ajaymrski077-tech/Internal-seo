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

    const formattedClients = clients.map((client) => {
      const primaryProperty = client.properties?.[0];
      const campaigns = client.linkCampaigns || [];
      const opps = campaigns.flatMap(c => c.opportunities || []);
      const hasClientData = opps.length > 0 || campaigns.length > 0;
      const competitorsCount = hasClientData ? Math.min(opps.length, 10) : 0;
      const lastOpp = opps[0];
      const updatedDate = lastOpp?.discoveredAt ? `Updated ${new Date(lastOpp.discoveredAt).toLocaleDateString("en-GB")}` : hasClientData ? "Updated recently" : null;

      return {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain ? (primaryProperty.domain.startsWith("http") ? primaryProperty.domain : `https://${primaryProperty.domain}`) : `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        hasClientData,
        competitorsCount,
        updatedDate
      };
    });

    return NextResponse.json({ clients: formattedClients });
  } catch (error: unknown) {
    console.error("Backlink Analysis Overview Error:", error);
    return NextResponse.json({ error: "Failed to load backlink analysis" }, { status: 500 });
  }
}
