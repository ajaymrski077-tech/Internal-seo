import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Find all website properties from the database
    const properties = await prisma.websiteProperty.findMany({
      include: {
        client: { select: { id: true, name: true } },
        connections: { where: { provider: "GSC" } },
        snapshots: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          },
          orderBy: { date: "asc" }
        }
      }
    });

    const formatProperty = (p: typeof properties[0]) => {
      let totalClicks = 0;
      let totalImpressions = 0;
      let positionSum = 0;
      let count = 0;

      const chartData = (p.snapshots || []).map((s) => {
        totalClicks += s.organicTraffic || 0;
        totalImpressions += s.gscImpressions || 0;
        if (s.gscPosition > 0) {
          positionSum += s.gscPosition;
          count++;
        }
        return {
          date: s.date ? new Date(s.date).toISOString().split("T")[0] : "",
          clicks: s.organicTraffic || 0,
          impressions: s.gscImpressions || 0
        };
      });

      const isConnected = (p.connections || []).some(c => c.status === "CONNECTED");

      return {
        id: p.id,
        domain: p.domain,
        clientId: p.clientId,
        clientName: p.client?.name || p.name || p.domain,
        clicks: totalClicks,
        impressions: totalImpressions,
        avgPosition: count > 0 ? (positionSum / count).toFixed(1) : "0.0",
        isConnected,
        chartData
      };
    };

    const formatted = properties.map(formatProperty);

    // Split into client sites vs internal sites based on client name or brandType
    const clientSites = formatted.filter(p => !p.domain.includes("internal") && !p.clientName.toLowerCase().includes("internal"));
    const internalSites = formatted.filter(p => p.domain.includes("internal") || p.clientName.toLowerCase().includes("internal"));

    return NextResponse.json({ 
      data: formatted,
      clientSites: clientSites.length > 0 ? clientSites : formatted,
      internalSites
    });
  } catch (error: unknown) {
    console.error("GSC Overview API Error:", error);
    return NextResponse.json({ error: "Failed to load GSC overview" }, { status: 500 });
  }
}
