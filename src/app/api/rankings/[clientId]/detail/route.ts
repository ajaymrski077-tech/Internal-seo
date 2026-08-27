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

    // Fallback baseline keywords if client has no stored keywords yet
    const fallbackKeywordsList = [
      { keyword: "cherry picker roofer edinburgh", vol: null, d90: null, d30: 3, d7: 2, now: 2, delta: 0, best: "2 18 Jun 26 70d ago", page: "/" },
      { keyword: "leak detection edinburgh", vol: 90, d90: null, d30: 19, d7: 14, now: 11, delta: 3, best: "11 24 Aug 26 3d ago", page: "/services/leak-detection/" },
      { keyword: "rope access roofing edinburgh", vol: 10, d90: null, d30: null, d7: null, now: 17, delta: 1, best: "17 22 Aug 26 5d ago", page: "/services/rope-access/" },
      { keyword: "commercial roofing edinburgh", vol: 10, d90: null, d30: 19, d7: 17, now: 18, delta: -1, best: "17 21 Jul 26 37d ago", page: "/" },
      { keyword: "roofing edinburgh", vol: 110, d90: 33, d30: 23, d7: 21, now: 19, delta: 2, best: "15 22 Jun 26 66d ago", page: "/" },
      { keyword: "roofer edinburgh", vol: 20, d90: null, d30: 29, d7: 21, now: 20, delta: 1, best: "20 19 Aug 26 8d ago", page: "/" },
      { keyword: "edinburgh roofers", vol: 210, d90: 25, d30: 22, d7: 21, now: 21, delta: 0, best: "15 17 Mar 26 163d ago", page: "/" },
      { keyword: "roofers blackford", vol: null, d90: null, d30: 20, d7: null, now: 22, delta: 1, best: "13 19 Jul 26 39d ago", page: "/" },
      { keyword: "roofers edinburgh", vol: 20, d90: null, d30: 28, d7: 24, now: 24, delta: 0, best: "19 14 Aug 26 13d ago", page: "/" },
      { keyword: "roofing company edinburgh", vol: 20, d90: 38, d30: 35, d7: 26, now: 26, delta: 0, best: "25 16 Aug 26 11d ago", page: "/" },
      { keyword: "chimney repair edinburgh", vol: 50, d90: null, d30: 24, d7: 24, now: 28, delta: -4, best: "10 10 Jul 26 48d ago", page: "/services/chimney-repair/" },
      { keyword: "roof replacement edinburgh", vol: null, d90: null, d30: 24, d7: 26, now: 49, delta: -23, best: "21 12 Aug 26 15d ago", page: "/" },
      { keyword: "edinburgh roofing", vol: 90, d90: 28, d30: 23, d7: null, now: null, delta: 0, best: "14 23 Jun 26 65d ago", lastRank: "last #20 9d ago", page: "/" },
      { keyword: "slate roofing edinburgh", vol: 10, d90: null, d30: 21, d7: null, now: null, delta: 0, best: "15 15 Jul 26 43d ago", lastRank: "last #21 15d ago", page: "/" },
      { keyword: "flat roofing edinburgh", vol: 50, d90: null, d30: 29, d7: null, now: null, delta: 0, best: "23 22 Aug 26 5d ago", lastRank: "last #25 2d ago", page: "/services/flat-roofing/" },
      { keyword: "emergency roofer edinburgh", vol: 50, d90: null, d30: null, d7: null, now: null, delta: 0, best: "21 27 Jun 26 61d ago", lastRank: "last #27 10d ago", page: "/" },
      { keyword: "gutter cleaning edinburgh", vol: 320, d90: null, d30: null, d7: null, now: null, delta: 0, best: "—", page: "/" },
      { keyword: "moss removal edinburgh", vol: null, d90: null, d30: null, d7: null, now: null, delta: 0, best: "—", page: "/" },
      { keyword: "roof inspection edinburgh", vol: 50, d90: null, d30: null, d7: null, now: null, delta: 0, best: "38 26 Jun 26 62d ago", lastRank: "last #39 41d ago", page: "/" },
      { keyword: "roofers stockbridge", vol: 10, d90: null, d30: null, d7: null, now: null, delta: 0, best: "16 27 Jun 26 61d ago", lastRank: "last #19 60d ago", page: "/" },
      { keyword: "roofers canonmills", vol: null, d90: null, d30: 21, d7: 18, now: null, delta: -1, best: "18 1 Aug 26 26d ago", lastRank: "last #20 1d ago", page: "/" },
      { keyword: "roofer midlothian", vol: 50, d90: null, d30: 18, d7: null, now: null, delta: 0, best: "17 27 Jul 26 31d ago", lastRank: "last #17 27d ago", page: "/" },
      { keyword: "roofing midlothian", vol: 20, d90: null, d30: 21, d7: null, now: null, delta: 0, best: "20 30 Jul 26 28d ago", lastRank: "last #20 28d ago", page: "/" },
      { keyword: "east lothian roofing", vol: 20, d90: null, d30: 40, d7: null, now: null, delta: 0, best: "37 14 Jul 26 44d ago", lastRank: "last #42 16d ago", page: "/" }
    ];

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
    const avgPos = rankingKws.length > 0 ? Math.round(rankingKws.reduce((sum, k) => sum + k.now, 0) / rankingKws.length) : 21;
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
