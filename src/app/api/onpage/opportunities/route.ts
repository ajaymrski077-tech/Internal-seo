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

    const properties = await prisma.websiteProperty.findMany({
      include: {
        client: { select: { id: true, name: true } },
        trackedKeywords: {
          include: {
            snapshots: { orderBy: { date: "desc" }, take: 1 }
          }
        }
      }
    });

    const opportunities: Array<{
      id: string;
      clientName: string;
      domain: string;
      propertyId: string;
      url: string;
      keyword: string;
      currentPos: number;
      volume: number;
      potentialClicks: number;
    }> = [];

    properties.forEach((prop) => {
      const keywords = prop.trackedKeywords || [];
      keywords.forEach((k) => {
        const latest = k.snapshots?.[0];
        const pos = latest?.position || 12;
        const volume = latest?.impressions || 100;
        
        if (pos >= 4 && pos <= 20) {
          const expectedPos1Ctr = 0.28;
          const currentCtr = latest?.ctr ? latest.ctr / 100 : 0.03;
          const potentialClicks = Math.round(volume * (expectedPos1Ctr - currentCtr));

          opportunities.push({
            id: k.id,
            clientName: prop.client?.name || prop.name,
            domain: prop.domain,
            propertyId: prop.id,
            url: k.targetUrl || (prop.domain.startsWith("http") ? prop.domain : `https://${prop.domain}`),
            keyword: k.keyword,
            currentPos: pos,
            volume,
            potentialClicks: Math.max(potentialClicks, 5)
          });
        }
      });
    });

    opportunities.sort((a, b) => b.potentialClicks - a.potentialClicks);

    return NextResponse.json({ opportunities });
  } catch (error: unknown) {
    console.error("On-Page Opportunities Error:", error);
    return NextResponse.json({ error: "Failed to load opportunity worklist" }, { status: 500 });
  }
}
