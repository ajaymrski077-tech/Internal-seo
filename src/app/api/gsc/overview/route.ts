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

    // Find all properties that have a GSC connection
    const properties = await prisma.websiteProperty.findMany({
      where: {
        connections: {
          some: { provider: "GSC", status: "CONNECTED" }
        }
      },
      include: {
        client: { select: { name: true } },
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

    const data = properties.map((p: any) => {
      let totalClicks = 0;
      let totalImpressions = 0;
      let positionSum = 0;
      let count = 0;

      const chartData = p.snapshots.map((s: any) => {
        totalClicks += s.organicTraffic;
        totalImpressions += s.gscImpressions;
        if (s.gscPosition > 0) {
          positionSum += s.gscPosition;
          count++;
        }
        return {
          date: s.date.toISOString().split("T")[0],
          clicks: s.organicTraffic,
          impressions: s.gscImpressions
        };
      });

      return {
        id: p.id,
        domain: p.domain,
        clientId: p.clientId,
        clientName: p.client.name,
        clicks: totalClicks,
        impressions: totalImpressions,
        avgPosition: count > 0 ? (positionSum / count).toFixed(1) : "0.0",
        chartData
      };
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("GSC Overview API Error:", error);
    return NextResponse.json({ error: "Failed to load GSC overview" }, { status: 500 });
  }
}
