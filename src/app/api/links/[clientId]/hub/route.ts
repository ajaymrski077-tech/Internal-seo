import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { clientId } = await params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(clientId);

    let client = null;
    if (isObjectId) {
      client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          properties: true,
          linkCampaigns: {
            include: {
              opportunities: true,
              acquiredLinks: true
            }
          }
        }
      });
    }

    if (!client) {
      client = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { contains: clientId, mode: "insensitive" } },
            { website: { contains: clientId, mode: "insensitive" } }
          ]
        },
        include: {
          properties: true,
          linkCampaigns: {
            include: {
              opportunities: true,
              acquiredLinks: true
            }
          }
        }
      });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const primaryProperty = client.properties?.[0];
    const campaigns = client.linkCampaigns || [];
    const opps = campaigns.flatMap(c => c.opportunities || []);
    const links = campaigns.flatMap(c => c.acquiredLinks || []);

    const monthlyTarget = campaigns[0]?.monthlyTarget || 40;
    const linksSecuredCount = links.filter(l => l.status === "LIVE").length;
    const qualifiedCount = opps.filter(o => o.status === "QUALIFIED").length;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        monthlyTarget,
        geography: "United Kingdom",
        competitorsCount: 0
      },
      stats: {
        prospectsQualified: qualifiedCount,
        targetProspects: monthlyTarget,
        emailsSent: 0,
        linksSecured: linksSecuredCount,
        trackedLinksTotal: links.length,
        openCampaigns: campaigns.length || 1,
        recentLinks: []
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        prospectsCount: c.opportunities?.length || 0,
        acquiredCount: c.acquiredLinks?.length || 0
      }))
    });
  } catch (error: unknown) {
    console.error("Client Links Hub Error:", error);
    return NextResponse.json({ error: "Failed to load client link hub" }, { status: 500 });
  }
}
