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

    const { searchParams } = new URL(req.url);
    const daysRange = parseInt(searchParams.get("days") || "30", 10);

    const clients = await prisma.client.findMany({
      include: {
        properties: {
          include: {
            trackedKeywords: {
              where: { status: "ACTIVE" },
              include: {
                snapshots: {
                  orderBy: { date: "asc" }
                }
              }
            },
            snapshots: {
              orderBy: { date: "desc" },
              take: 14
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const clientSites: any[] = [];
    const internalSites: any[] = [];

    clients.forEach((client) => {
      const isInternal = client.name.toLowerCase().includes("mistersk") || client.name.toLowerCase().includes("mister sk") || client.name.toLowerCase().includes("fix my roof") || client.name.toLowerCase().includes("booked solid") || client.name.toLowerCase().includes("garden living") || client.name.toLowerCase().includes("reliable equipment");

      const primaryProperty = client.properties?.[0];
      const keywords = primaryProperty?.trackedKeywords || [];
      const totalKeywords = keywords.length;

      let top3 = 0;
      let top10 = 0;
      let posSum = 0;
      let posCount = 0;
      let upYesterday = 0;
      let downYesterday = 0;

      keywords.forEach((kw) => {
        const snaps = kw.snapshots || [];
        const latest = snaps[snaps.length - 1];
        const prev = snaps[snaps.length - 2];

        if (latest?.position) {
          const pos = latest.position;
          posSum += pos;
          posCount++;

          if (pos <= 3) top3++;
          if (pos <= 10) top10++;
        }

        if (prev && latest) {
          if (latest.position && prev.position) {
            if (latest.position < prev.position) upYesterday++;
            else if (latest.position > prev.position) downYesterday++;
          }
        }
      });

      const avgPosition = posCount > 0 ? Math.round(posSum / posCount) : null;
      const avgPositionDelta = upYesterday > downYesterday ? upYesterday - downYesterday : -(downYesterday - upYesterday);

      // Generate 14-day sparkline from property snapshots or calculated
      const propSnaps = primaryProperty?.snapshots || [];
      let sparkline: number[] = [];
      if (propSnaps.length >= 7) {
        sparkline = propSnaps.slice().reverse().map(s => s.gscPosition || avgPosition || 0);
      } else {
        // Enforce zero mock sparkline
        sparkline = [];
      }

      const item = {
        id: client.id,
        propertyId: primaryProperty?.id || null,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        keywords: totalKeywords,
        avgPosition,
        avgPositionDelta: avgPositionDelta || 0,
        top3,
        top10,
        vsYesterday: {
          up: upYesterday,
          down: downYesterday
        },
        sparkline,
        lastSynced: null
      };

      if (isInternal) {
        internalSites.push(item);
      } else {
        clientSites.push(item);
      }
    });

    return NextResponse.json({
      clientSites,
      internalSites,
      totalTracked: clientSites.reduce((sum, c) => sum + c.keywords, 0) + internalSites.reduce((sum, c) => sum + c.keywords, 0)
    });
  } catch (error: unknown) {
    console.error("Rankings Overview Error:", error);
    return NextResponse.json({ error: "Failed to load rankings overview" }, { status: 500 });
  }
}
