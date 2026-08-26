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

    interface SnapshotRecord {
      date: Date;
      organicTraffic: number;
      gscImpressions: number;
      gscPosition: number;
    }
    interface GscPropRecord {
      id: string | number;
      domain: string;
      clientId: string | number;
      client: { name: string };
      snapshots: SnapshotRecord[];
    }

    const data = (properties as unknown as GscPropRecord[]).map((p) => {
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
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("GSC Overview API Error:", error);
    return NextResponse.json({ error: "Failed to load GSC overview" }, { status: 500 });
  }
}
