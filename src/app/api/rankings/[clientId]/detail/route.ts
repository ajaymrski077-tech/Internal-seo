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
          properties: {
            include: {
              trackedKeywords: {
                include: {
                  snapshots: {
                    orderBy: { date: "asc" }
                  }
                }
              }
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
          properties: {
            include: {
              trackedKeywords: {
                include: {
                  snapshots: {
                    orderBy: { date: "asc" }
                  }
                }
              }
            }
          }
        }
      });
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const primaryProperty = client.properties?.[0];
    const rawKeywords = primaryProperty?.trackedKeywords || [];

    // Remove fallback baseline keywords, enforce zero mock data
    const fallbackKeywordsList: any[] = [];

    let keywordsList: any[] = [];
    if (rawKeywords.length > 0) {
      keywordsList = rawKeywords.map((k) => {
        const snaps = k.snapshots || [];
        const latest = snaps[snaps.length - 1];
        const prev = snaps[snaps.length - 2];
        const now = latest?.position ? Math.round(latest.position) : null;
        const delta = prev?.position && latest?.position ? Math.round(prev.position - latest.position) : 0;
        
        return {
          id: k.id,
          keyword: k.keyword,
          vol: latest?.impressions || null,
          d90: null,
          d30: snaps.find(s => {
            const d = new Date(s.date);
            const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo >= 25 && daysAgo <= 35;
          })?.position || null,
          d7: snaps.find(s => {
            const d = new Date(s.date);
            const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo >= 5 && daysAgo <= 10;
          })?.position || null,
          now,
          delta,
          best: now ? `${now} Today` : "—",
          lastRank: null,
          page: k.targetUrl || "/",
          trend: snaps.slice(-14).map(s => s.position || 20)
        };
      });
    } else {
      keywordsList = fallbackKeywordsList.map((item, idx) => ({
        id: `kw-${idx}`,
        ...item,
        trend: [item.now ? item.now + 2 : 20, item.now ? item.now + 1 : 20, item.now ? item.now : 20]
      }));
    }

    const trackedCount = keywordsList.length;
    const top3 = keywordsList.filter(k => k.now && k.now <= 3).length;
    const top10 = keywordsList.filter(k => k.now && k.now <= 10).length;
    const rankingKws = keywordsList.filter(k => k.now && k.now > 0);
    const avgPos = rankingKws.length > 0 ? Math.round(rankingKws.reduce((sum, k) => sum + k.now, 0) / rankingKws.length) : null;
    const notRanking = keywordsList.filter(k => !k.now).length;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        lastSynced: "2026-08-27 07:00:00",
      },
      summary: {
        tracked: trackedCount,
        top3,
        top10,
        avgPos,
        notRanking
      },
      keywords: keywordsList
    });
  } catch (error: unknown) {
    console.error("Rank Tracker Detail Error:", error);
    return NextResponse.json({ error: "Failed to load rank tracker details" }, { status: 500 });
  }
}
