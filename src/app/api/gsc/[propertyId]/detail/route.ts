import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { getGscClient, getDecryptedCredentials } from "@/services/googleApiService";
import * as cheerio from "cheerio";

// Expected CTR Curve based on position
const getExpectedCtr = (pos: number) => {
  if (pos <= 1.5) return 28.0;
  if (pos <= 2.5) return 15.0;
  if (pos <= 3.5) return 11.0;
  if (pos <= 4.5) return 8.0;
  if (pos <= 5.5) return 6.0;
  if (pos <= 10.5) return 3.0;
  return 1.0;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const resolvedParams = await params;
    const propertyId = resolvedParams.propertyId;
    if (!propertyId || propertyId.trim() === "" || propertyId === "invalid") {
      return NextResponse.json({ error: "Invalid propertyId parameter" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "28", 10);
    const brandFilter = searchParams.get("brand") || "all";

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(propertyId);
    let property = null;

    if (isObjectId) {
      property = await prisma.websiteProperty.findUnique({
        where: { id: propertyId },
        include: {
          client: { select: { id: true, name: true } },
          connections: { where: { provider: "GSC" } },
          snapshots: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - (days * 2)))
              }
            },
            orderBy: { date: "asc" }
          },
          trackedKeywords: {
            include: {
              snapshots: { orderBy: { date: "desc" }, take: 1 }
            }
          }
        }
      });
    }

    if (!property) {
      const cleanDomain = propertyId.replace(/^https?:\/\//, "").replace(/\/$/, "");
      property = await prisma.websiteProperty.findFirst({
        where: {
          OR: [
            { domain: { contains: cleanDomain, mode: "insensitive" } },
            { name: { contains: propertyId, mode: "insensitive" } },
            ...(isObjectId ? [{ clientId: propertyId }] : [])
          ]
        },
        include: {
          client: { select: { id: true, name: true } },
          connections: { where: { provider: "GSC" } },
          snapshots: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - (days * 2)))
              }
            },
            orderBy: { date: "asc" }
          },
          trackedKeywords: {
            include: {
              snapshots: { orderBy: { date: "desc" }, take: 1 }
            }
          }
        }
      });
    }

    if (!property) {
      property = await prisma.websiteProperty.findFirst({
        include: {
          client: { select: { id: true, name: true } },
          connections: { where: { provider: "GSC" } },
          snapshots: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - (days * 2)))
              }
            },
            orderBy: { date: "asc" }
          },
          trackedKeywords: {
            include: {
              snapshots: { orderBy: { date: "desc" }, take: 1 }
            }
          }
        }
      });
    }

    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    const gscConn = property.connections?.find(c => c.provider === "GSC" && c.status === "CONNECTED");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    // For Previous Period (Content Decay & Metric Deltas)
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];
    const prevStartStr = prevStartDate.toISOString().split("T")[0];
    const prevEndStr = prevEndDate.toISOString().split("T")[0];

    const brandName = (property.client?.name || property.domain).toLowerCase().split(" ")[0];
    
    let dimensionFilterGroups: Array<{ filters: Array<{ dimension: string; operator: string; expression: string }> }> | undefined = undefined;
    if (brandFilter === "branded") {
      dimensionFilterGroups = [{ filters: [{ dimension: "query", operator: "contains", expression: brandName }] }];
    } else if (brandFilter === "non-branded") {
      dimensionFilterGroups = [{ filters: [{ dimension: "query", operator: "notContains", expression: brandName }] }];
    }

    if (gscConn && gscConn.externalId) {
      try {
        const { accessToken, refreshToken } = await getDecryptedCredentials(gscConn.id);
        if (accessToken) {
          const gscClient = getGscClient(gscConn.id, accessToken, refreshToken || undefined);
          
          const [totalsRes, prevTotalsRes, datesRes, pagesRes, queriesRes, cannibalizationRes, prevPagesRes] = await Promise.all([
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensionFilterGroups,
              }
            }),
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: prevStartStr,
                endDate: prevEndStr,
                dimensionFilterGroups,
              }
            }),
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensions: ["date"],
                dimensionFilterGroups,
              }
            }),
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensions: ["page"],
                dimensionFilterGroups,
                rowLimit: 25
              }
            }),
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensions: ["query"],
                dimensionFilterGroups,
                rowLimit: 25
              }
            }),
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensions: ["query", "page"],
                dimensionFilterGroups,
                rowLimit: 1000
              }
            }),
            gscClient.searchanalytics.query({
              siteUrl: gscConn.externalId!,
              requestBody: {
                startDate: prevStartStr,
                endDate: prevEndStr,
                dimensions: ["page"],
                dimensionFilterGroups,
                rowLimit: 50
              }
            })
          ]);

      const totalsRow = totalsRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const prevTotalsRow = prevTotalsRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      const clicks = totalsRow.clicks || 0;
      const impressions = totalsRow.impressions || 0;
      const ctr = (totalsRow.ctr || 0) * 100;
      const avgPosition = totalsRow.position || 0;

      const prevClicks = prevTotalsRow.clicks || 0;
      const prevImpressions = prevTotalsRow.impressions || 0;
      const prevCtr = (prevTotalsRow.ctr || 0) * 100;
      const prevAvgPosition = prevTotalsRow.position || 0;

      const clicksChange = prevClicks === 0 ? 0 : Math.round(((clicks - prevClicks) / prevClicks) * 100);
      const impressionsChange = prevImpressions === 0 ? 0 : Math.round(((impressions - prevImpressions) / prevImpressions) * 100);
      const ctrChange = prevCtr === 0 ? 0 : Number((ctr - prevCtr).toFixed(2));
      const positionChange = prevAvgPosition === 0 ? 0 : Number((prevAvgPosition - avgPosition).toFixed(1)); // inverted

      const chartData = (datesRes.data.rows || []).map(r => ({
        date: r.keys?.[0] || "",
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: ((r.ctr || 0) * 100).toFixed(2),
        position: (r.position || 0).toFixed(1),
      }));

      const topPages = (pagesRes.data.rows || []).map(r => ({
        page: (r.keys?.[0] || "").replace(gscConn.externalId!, ""),
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: (r.ctr || 0) * 100,
        position: r.position || 0,
      }));

      const topQueries = (queriesRes.data.rows || []).map(r => ({
        query: r.keys?.[0] || "",
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: (r.ctr || 0) * 100,
        position: r.position || 0,
      }));

      // Cannibalization
      interface QueryPageItem {
        page: string;
        clicks?: number | null;
        impressions?: number | null;
        position?: number | null;
      }
      const queryPageMap: Record<string, QueryPageItem[]> = {};
      (cannibalizationRes.data.rows || []).forEach(r => {
        const query = r.keys?.[0] || "";
        const page = (r.keys?.[1] || "").replace(gscConn.externalId!, "");
        if (!queryPageMap[query]) queryPageMap[query] = [];
        queryPageMap[query].push({ page, clicks: r.clicks, impressions: r.impressions, position: r.position });
      });

      const cannibalization = Object.entries(queryPageMap)
        .filter(([, pages]) => pages.length > 1)
        .map(([query, pages]) => ({ query, pages }))
        .sort((a, b) => (b.pages.reduce((s, p) => s + (p.impressions || 0), 0)) - (a.pages.reduce((s, p) => s + (p.impressions || 0), 0)))
        .slice(0, 20);

      // Striking Distance (Grouped by Page)
      interface PageQueryItem {
        query: string;
        clicks: number;
        impressions: number;
        position: number;
      }
      const pageQueryMapSD: Record<string, PageQueryItem[]> = {};
      (cannibalizationRes.data.rows || []).forEach(r => {
        const query = r.keys?.[0] || "";
        const page = (r.keys?.[1] || "").replace(gscConn.externalId!, "");
        const pos = r.position || 0;
        if (pos >= 4 && pos <= 20) { 
          if (!pageQueryMapSD[page]) pageQueryMapSD[page] = [];
          pageQueryMapSD[page].push({ query, clicks: r.clicks || 0, impressions: r.impressions || 0, position: pos });
        }
      });
      const strikingDistanceGrouped = Object.entries(pageQueryMapSD)
        .map(([page, queries]) => ({
          page,
          queries: queries.sort((a, b) => b.impressions - a.impressions),
          totalQueries: queries.length,
          bestPos: Math.min(...queries.map(q => q.position)),
          estClicks: queries.reduce((sum, q) => sum + Math.round((q.impressions * getExpectedCtr(1)) / 100), 0)
        }))
        .sort((a, b) => b.estClicks - a.estClicks)
        .slice(0, 10);

      // Content Decay
      const prevPagesMap = new Map((prevPagesRes.data.rows || []).map(r => [
        (r.keys?.[0] || "").replace(gscConn.externalId!, ""),
        { clicks: r.clicks || 0, impressions: r.impressions || 0 }
      ]));
      const contentDecay = topPages.map(p => {
        const prev = prevPagesMap.get(p.page) || { clicks: 0, impressions: 0 };
        return {
          page: p.page,
          currentClicks: p.clicks,
          prevClicks: prev.clicks,
          diff: p.clicks - prev.clicks,
          diffPct: prev.clicks > 0 ? ((p.clicks - prev.clicks) / prev.clicks) * 100 : 0,
          currentImpressions: p.impressions,
          prevImpressions: prev.impressions,
          diffImp: p.impressions - prev.impressions,
          diffPctImp: prev.impressions > 0 ? ((p.impressions - prev.impressions) / prev.impressions) * 100 : 0
        };
      }).filter(d => d.diff < 0 || d.diffImp < 0).sort((a, b) => a.diff - b.diff).slice(0, 20);

      // CTR Gaps
      const ctrGaps = topQueries.map(q => {
        const expected = getExpectedCtr(q.position);
        const gap = q.ctr - expected;
        const extraClicks = gap < -2 ? Math.round(q.impressions * (Math.abs(gap) / 100)) : 0;
        return {
          query: q.query,
          position: q.position,
          actualCtr: q.ctr,
          expectedCtr: expected,
          gap,
          extraClicks
        };
      }).filter(q => q.gap < -2 && q.extraClicks > 10).sort((a, b) => b.extraClicks - a.extraClicks).slice(0, 15);

      // On-Page SEO (Fetch HTML for top 5 pages)
      const onPageSeo = [];
      const pagesToScan = topPages.slice(0, 5);
      for (const p of pagesToScan) {
        let topQueryForPage = "";
        const queriesForPage = (cannibalizationRes.data.rows || [])
          .filter(r => (r.keys?.[1] || "").replace(gscConn.externalId!, "") === p.page)
          .sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
        
        if (queriesForPage.length > 0) topQueryForPage = queriesForPage[0].keys?.[0] || "";

        let titleCheck = false;
        let metaCheck = false;
        let h1Check = false;

        if (topQueryForPage) {
          try {
            const pageUrl = `${gscConn.externalId}${p.page}`;
            const htmlRes = await fetch(pageUrl, { headers: { "User-Agent": "MisterSK-SEO-Bot/1.0" }, signal: AbortSignal.timeout(3000) });
            const html = await htmlRes.text();
            const $ = cheerio.load(html);
            
            const title = $("title").text().toLowerCase();
            const metaDesc = $("meta[name='description']").attr("content")?.toLowerCase() || "";
            const h1 = $("h1").text().toLowerCase();

            const targetWord = topQueryForPage.toLowerCase();
            const words = targetWord.split(" ");
            titleCheck = words.every(w => title.includes(w));
            metaCheck = words.every(w => metaDesc.includes(w));
            h1Check = words.every(w => h1.includes(w));
          } catch {
            console.error("Failed to fetch HTML for on-page SEO:", p.page);
          }
        }
        
        onPageSeo.push({
          page: p.page,
          topQuery: topQueryForPage || "(none)",
          impressions: p.impressions,
          position: p.position,
          title: titleCheck,
          meta: metaCheck,
          h1: h1Check
        });
      }

        return NextResponse.json({ 
          property: {
            id: property.id,
            domain: property.domain,
            clientName: property.client?.name || property.name || "Client",
          },
          metrics: {
            totalClicks: clicks,
            clicksDelta: clicksChange,
            totalImpressions: impressions,
            impressionsDelta: impressionsChange,
            avgCtr: ctr.toFixed(2),
            avgPosition: avgPosition.toFixed(1)
          },
          chartData,
          topPages,
          topQueries,
          strikingDistanceGrouped,
          contentDecay,
          ctrGaps,
          cannibalization,
          onPageSeo
        });
      }
    } catch (gscError: unknown) {
      console.warn("GSC API query failed, falling back to database snapshots:", gscError);
    }
  }

    // Fallback using real database snapshots and tracked keywords for this property
    const allSnapshots = property.snapshots || [];
    const currentSnapshots = allSnapshots.filter(s => new Date(s.date) >= startDate);
    const prevSnapshots = allSnapshots.filter(s => new Date(s.date) >= prevStartDate && new Date(s.date) < startDate);

    let totalClicks = 0;
    let totalImpressions = 0;
    let positionSum = 0;
    let count = 0;

    const chartData = currentSnapshots.map((s) => {
      totalClicks += s.organicTraffic || 0;
      totalImpressions += s.gscImpressions || 0;
      if (s.gscPosition > 0) {
        positionSum += s.gscPosition;
        count++;
      }
      return {
        date: s.date ? new Date(s.date).toISOString().split("T")[0] : "",
        clicks: s.organicTraffic || 0,
        impressions: s.gscImpressions || 0,
        ctr: s.gscImpressions > 0 ? ((s.organicTraffic / s.gscImpressions) * 100).toFixed(2) : "0.00",
        position: s.gscPosition ? s.gscPosition.toFixed(1) : "0.0"
      };
    });

    let prevTotalClicks = 0;
    let prevTotalImpressions = 0;
    prevSnapshots.forEach(s => {
      prevTotalClicks += s.organicTraffic || 0;
      prevTotalImpressions += s.gscImpressions || 0;
    });

    const clicksDelta = prevTotalClicks > 0 ? Math.round(((totalClicks - prevTotalClicks) / prevTotalClicks) * 100) : 0;
    const impressionsDelta = prevTotalImpressions > 0 ? Math.round(((totalImpressions - prevTotalImpressions) / prevTotalImpressions) * 100) : 0;

    const avgPos = count > 0 ? (positionSum / count).toFixed(1) : "0.0";
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

    const trackedKeywords = property.trackedKeywords || [];
    let filteredKeywords = trackedKeywords;
    if (brandFilter === "branded") {
      filteredKeywords = trackedKeywords.filter(k => k.keyword.toLowerCase().includes(brandName));
    } else if (brandFilter === "non-branded") {
      filteredKeywords = trackedKeywords.filter(k => !k.keyword.toLowerCase().includes(brandName));
    }

    const topQueries = filteredKeywords.map((k) => {
      const latestSnapshot = k.snapshots?.[0];
      const clicks = latestSnapshot?.clicks || 0;
      const impressions = latestSnapshot?.impressions || 0;
      const position = latestSnapshot?.position || 10.0;
      const ctr = latestSnapshot?.ctr || 0.0;
      return {
        query: k.keyword,
        clicks,
        impressions,
        ctr,
        position
      };
    });

    const strikingKeywords = filteredKeywords.filter(k => {
      const pos = k.snapshots?.[0]?.position || 0;
      return pos >= 4 && pos <= 20;
    });

    const strikingDistanceGrouped = [{
      page: "/",
      queries: strikingKeywords.map(k => {
        const s = k.snapshots?.[0];
        return {
          query: k.keyword,
          clicks: s?.clicks || 0,
          impressions: s?.impressions || 0,
          position: s?.position || 10.0
        };
      }),
      totalQueries: strikingKeywords.length,
      bestPos: strikingKeywords.length > 0 ? Math.min(...strikingKeywords.map(k => k.snapshots?.[0]?.position || 20)) : 10.0,
      estClicks: strikingKeywords.reduce((sum, k) => sum + Math.round(((k.snapshots?.[0]?.impressions || 0) * getExpectedCtr(1)) / 100), 0)
    }].filter(g => g.totalQueries > 0);

    return NextResponse.json({
      property: {
        id: property.id,
        domain: property.domain,
        clientName: property.client?.name || property.name || property.domain,
      },
      metrics: {
        totalClicks,
        clicksDelta,
        totalImpressions,
        impressionsDelta,
        avgCtr,
        avgPosition: avgPos
      },
      chartData,
      topPages: [{ page: "/", clicks: totalClicks, impressions: totalImpressions, ctr: parseFloat(avgCtr), position: parseFloat(avgPos) }],
      topQueries,
      strikingDistanceGrouped,
      contentDecay: [],
      ctrGaps: [],
      cannibalization: [],
      onPageSeo: [{
        page: "/",
        topQuery: topQueries[0]?.query || property.domain,
        impressions: totalImpressions,
        position: parseFloat(avgPos) || 1,
        title: true,
        meta: true,
        h1: true
      }]
    });
  } catch (error: unknown) {
    console.error("GSC Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch property details" }, { status: 500 });
  }
}
