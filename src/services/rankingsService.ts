import prisma from "@/lib/db";
import { getGscClient, getDecryptedCredentials } from "./googleApiService";
import { getPreviousPeriodDates } from "./analyticsService";
import { IntegrationConnectionRecord, TrackedKeywordRecord, KeywordRankingSnapshotRecord } from "@/types/db";

// ====================================================
// RANKINGS SERVICE BUSINESS LOGIC
// ====================================================

export interface DiscoveredKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevClicks: number;
  prevImpressions: number;
  prevCtr: number;
  prevPosition: number;
  clicksChange: number;
  impressionsChange: number;
  positionChange: number; // positive = improved, negative = declined
  isTracked: boolean;
}

export const discoverKeywords = async (
  propertyId: string | number,
  days: number = 30
): Promise<DiscoveredKeyword[]> => {
  const property = await prisma.websiteProperty.findUnique({
    where: { id: propertyId },
    include: { connections: true, trackedKeywords: true }
  });
  if (!property) throw new Error("Property not found");

  const gscConn = property.connections.find((c: IntegrationConnectionRecord) => c.provider === "GSC");
  if (!gscConn || !gscConn.externalId) {
    return [];
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const prevDates = getPreviousPeriodDates(startDate, endDate);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];
  const prevStartStr = prevDates.start.toISOString().split("T")[0];
  const prevEndStr = prevDates.end.toISOString().split("T")[0];

  const { accessToken, refreshToken } = await getDecryptedCredentials(gscConn.id);
  if (!accessToken) return [];

  const gscClient = getGscClient(gscConn.id, accessToken, refreshToken || undefined);

  // Fetch current period queries
  const currResponse = await gscClient.searchanalytics.query({
    siteUrl: gscConn.externalId,
    requestBody: {
      startDate: startStr,
      endDate: endStr,
      dimensions: ["query"],
      rowLimit: 250,
    }
  });

  // Fetch previous period queries
  const prevResponse = await gscClient.searchanalytics.query({
    siteUrl: gscConn.externalId,
    requestBody: {
      startDate: prevStartStr,
      endDate: prevEndStr,
      dimensions: ["query"],
      rowLimit: 250,
    }
  });

  const currRows = currResponse.data.rows || [];
  const prevRows = prevResponse.data.rows || [];

  const prevMap: Record<string, typeof prevRows[0]> = {};
  for (const row of prevRows) {
    const q = row.keys?.[0];
    if (q) prevMap[q.toLowerCase().trim()] = row;
  }

  const trackedSet = new Set(property.trackedKeywords.map((k: TrackedKeywordRecord) => k.normalizedKeyword));

  const result: DiscoveredKeyword[] = [];

  for (const row of currRows) {
    const queryStr = row.keys?.[0];
    if (!queryStr) continue;

    const normalized = queryStr.toLowerCase().trim();
    const prevRow = prevMap[normalized];

    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const ctr = (row.ctr || 0) * 100;
    const position = row.position || 0.0;

    const prevClicks = prevRow ? (prevRow.clicks || 0) : 0;
    const prevImpressions = prevRow ? (prevRow.impressions || 0) : 0;
    const prevCtr = prevRow ? ((prevRow.ctr || 0) * 100) : 0.0;
    const prevPosition = prevRow ? (prevRow.position || 0.0) : 0.0;

    // Movement: lower number is better on Google (e.g. pos 18 to pos 10 is an improvement of +8)
    const positionChange = prevPosition > 0 ? parseFloat((prevPosition - position).toFixed(2)) : 0.0;
    const clicksChange = clicks - prevClicks;
    const impressionsChange = impressions - prevImpressions;

    result.push({
      query: queryStr,
      clicks,
      impressions,
      ctr,
      position: parseFloat(position.toFixed(2)),
      prevClicks,
      prevImpressions,
      prevCtr,
      prevPosition: parseFloat(prevPosition.toFixed(2)),
      clicksChange,
      impressionsChange,
      positionChange,
      isTracked: trackedSet.has(normalized),
    });
  }

  return result.sort((a, b) => b.impressions - a.impressions);
};

export const trackKeyword = async (
  clientId: string | number,
  propertyId: string | number,
  keyword: string,
  source: string = "MANUAL",
  targetUrl?: string | null,
  tags: string = ""
) => {
  const normalized = keyword.toLowerCase().trim();
  if (!normalized) throw new Error("Keyword cannot be empty");

  // Check client existence
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });
  if (!client) throw new Error("Client not found");

  // Check unique key constraint manually
  const existing = await prisma.trackedKeyword.findFirst({
    where: {
      propertyId,
      normalizedKeyword: normalized,
    }
  });

  if (existing) {
    if (existing.status !== "ACTIVE") {
      // Re-activate if paused or archived
      return prisma.trackedKeyword.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", targetUrl: targetUrl || existing.targetUrl, tags: tags || existing.tags }
      });
    }
    throw new Error("This keyword is already tracked for this website property.");
  }

  const tracked = await prisma.trackedKeyword.create({
    data: {
      clientId,
      propertyId,
      keyword: keyword.trim(),
      normalizedKeyword: normalized,
      status: "ACTIVE",
      tags: tags || "",
      targetUrl: targetUrl || null,
      source,
    }
  });

  // Log activity
  await logRankingActivity(
    "admin@mistersk.com",
    "KEYWORD_TRACKED",
    clientId,
    client.name,
    { keywordId: tracked.id, keyword: tracked.keyword }
  );

  // Backfill history (30 days GSC data)
  try {
    const property = await prisma.websiteProperty.findUnique({
      where: { id: propertyId },
      include: { connections: true }
    });
    const gscConn = property?.connections?.find((c: IntegrationConnectionRecord) => c.provider === "GSC");
    if (gscConn && gscConn.externalId) {
      await syncPropertyKeywords(propertyId, 30);
    }
  } catch (syncErr) {
    console.error("Failed to backfill keyword metrics on tracking:", syncErr);
  }

  return tracked;
};

// ====================================================
// SYNCHRONIZATION ENGINE
// ====================================================

export const syncPropertyKeywords = async (
  propertyId: string | number,
  daysToSync: number = 30
) => {
  const property = await prisma.websiteProperty.findUnique({
    where: { id: propertyId },
    include: { connections: true, trackedKeywords: { where: { status: "ACTIVE" } } }
  });

  if (!property || property.trackedKeywords.length === 0) return;

  const gscConn = property.connections.find((c: IntegrationConnectionRecord) => c.provider === "GSC");
  if (!gscConn || !gscConn.externalId) return;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysToSync);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const { accessToken, refreshToken } = await getDecryptedCredentials(gscConn.id);
  if (!accessToken) return;

  const gscClient = getGscClient(gscConn.id, accessToken, refreshToken || undefined);

  // Query search console with query+date dimensions in a single fetch
  const response = await gscClient.searchanalytics.query({
    siteUrl: gscConn.externalId,
    requestBody: {
      startDate: startStr,
      endDate: endStr,
      dimensions: ["query", "date"],
      rowLimit: 25000,
    }
  });

  const rows = response.data.rows || [];
  
  // Map tracked keywords by normalized name
  const kwMap: Record<string, number> = {};
  for (const kw of property.trackedKeywords) {
    kwMap[kw.normalizedKeyword] = kw.id;
  }

  const snapshotsToUpsert: Array<{
    trackedKeywordId: number;
    date: Date;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
  }> = [];

  for (const row of rows) {
    const rawQuery = row.keys?.[0];
    const rawDate = row.keys?.[1];
    if (!rawQuery || !rawDate) continue;

    const normalized = rawQuery.toLowerCase().trim();
    const kwId = kwMap[normalized];
    if (!kwId) continue; // Not a tracked keyword

    const dateObj = new Date(rawDate);
    dateObj.setHours(0, 0, 0, 0);

    snapshotsToUpsert.push({
      trackedKeywordId: kwId,
      date: dateObj,
      position: row.position || 0.0,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr || 0) * 100, // percentage representation
    });
  }

  // Execute database upserts
  for (const snap of snapshotsToUpsert) {
    const existing = await prisma.keywordRankingSnapshot.findUnique({
      where: {
        trackedKeywordId_date: {
          trackedKeywordId: snap.trackedKeywordId,
          date: snap.date,
        }
      }
    });

    if (existing) {
      await prisma.keywordRankingSnapshot.update({
        where: { id: existing.id },
        data: {
          position: snap.position,
          clicks: snap.clicks,
          impressions: snap.impressions,
          ctr: snap.ctr,
        }
      });
    } else {
      await prisma.keywordRankingSnapshot.create({
        data: {
          trackedKeywordId: snap.trackedKeywordId,
          date: snap.date,
          position: snap.position,
          clicks: snap.clicks,
          impressions: snap.impressions,
          ctr: snap.ctr,
        }
      });
    }
  }

  console.log(`Synced GSC keyword history for Property ID ${propertyId}. Rows matched: ${snapshotsToUpsert.length}`);
};

// ====================================================
// METRICS & INTELLIGENCE CALCULATIONS
// ====================================================

export const getRankingsOverview = async (
  clientId?: string | number,
  propertyId?: string | number,
  daysRange: number = 30
) => {
  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (clientId) where.clientId = clientId;
  if (propertyId) where.propertyId = propertyId;

  const keywords = await prisma.trackedKeyword.findMany({
    where,
    include: {
      client: { select: { name: true } },
      property: { select: { domain: true } },
      snapshots: {
        orderBy: { date: "asc" }
      }
    }
  });

  const today = new Date();
  const currentCutoff = new Date();
  currentCutoff.setDate(today.getDate() - 3); // 3 days buffer for GSC latency data
  const prevCutoff = new Date();
  prevCutoff.setDate(currentCutoff.getDate() - daysRange);

  const totalTracked = keywords.length;
  let avgCurrentPosSum = 0;
  let avgCurrentPosCount = 0;

  let top3Count = 0;
  let top10Count = 0;
  let top20Count = 0;

  let improvedCount = 0;
  let declinedCount = 0;

  const winnersList: Array<{ keyword: string; client: string; oldPos: number; newPos: number; change: number }> = [];
  const losersList: Array<{ keyword: string; client: string; oldPos: number; newPos: number; change: number }> = [];
  
  const top10Entrants: string[] = [];
  const top10Losses: string[] = [];

  const strikingDistance: Array<{
    id: number;
    keyword: string;
    client: string;
    domain: string;
    position: number;
    impressions: number;
    ctr: number;
    opportunityScore: number;
  }> = [];

  const highImpLowCtr: Array<{
    id: number;
    keyword: string;
    client: string;
    position: number;
    impressions: number;
    ctr: number;
  }> = [];

  // Group positions distribution
  const positionGroups = {
    top3: 0,   // 1-3
    top10: 0,  // 4-10
    top20: 0,  // 11-20
    top50: 0,  // 21-50
    top100: 0, // 51-100
    missing: 0 // null or out
  };

  for (const kw of keywords) {
    const snaps = kw.snapshots;
    if (snaps.length === 0) {
      positionGroups.missing++;
      continue;
    }

    // Get current value (latest snapshot close to today)
    const currentSnap = snaps.filter((s: KeywordRankingSnapshotRecord) => s.position !== null && s.position > 0).pop();
    // Get previous period comparator
    const prevSnap = snaps.filter((s: KeywordRankingSnapshotRecord) => s.date < prevCutoff && s.position !== null && s.position > 0).pop();

    if (!currentSnap || currentSnap.position === null) {
      positionGroups.missing++;
      continue;
    }

    const currPos = currentSnap.position;
    avgCurrentPosSum += currPos;
    avgCurrentPosCount++;

    // Distribution groups
    if (currPos <= 3) {
      top3Count++;
      positionGroups.top3++;
    } else if (currPos <= 10) {
      top10Count++;
      positionGroups.top10++;
    } else if (currPos <= 20) {
      top20Count++;
      positionGroups.top20++;
    } else if (currPos <= 50) {
      positionGroups.top50++;
    } else if (currPos <= 100) {
      positionGroups.top100++;
    } else {
      positionGroups.missing++;
    }

    // Striking Distance: 4 to 20
    if (currPos >= 4 && currPos <= 20) {
      // opportunity = impressions * (1 - CTR)
      const ctrVal = currentSnap.ctr / 100; // convert percentage representation to decimal
      const oppScore = currentSnap.impressions * (1 - ctrVal);
      strikingDistance.push({
        id: kw.id,
        keyword: kw.keyword,
        client: kw.client.name,
        domain: kw.property.domain,
        position: currPos,
        impressions: currentSnap.impressions,
        ctr: currentSnap.ctr,
        opportunityScore: parseFloat(oppScore.toFixed(1)),
      });
    }

    // High Impression (>=100) / Low CTR (<2%) config
    if (currentSnap.impressions >= 100 && currentSnap.ctr < 2.0) {
      highImpLowCtr.push({
        id: kw.id,
        keyword: kw.keyword,
        client: kw.client.name,
        position: currPos,
        impressions: currentSnap.impressions,
        ctr: currentSnap.ctr,
      });
    }

    // Compare changes
    if (prevSnap && prevSnap.position) {
      const prevPos = prevSnap.position;
      const change = prevPos - currPos; // positive = improved

      if (change > 0) {
        improvedCount++;
        winnersList.push({
          keyword: kw.keyword,
          client: kw.client.name,
          oldPos: prevPos,
          newPos: currPos,
          change: parseFloat(change.toFixed(2)),
        });

        // Top 10 Entry Check
        if (prevPos > 10 && currPos <= 10) {
          top10Entrants.push(kw.keyword);
        }
      } else if (change < 0) {
        declinedCount++;
        losersList.push({
          keyword: kw.keyword,
          client: kw.client.name,
          oldPos: prevPos,
          newPos: currPos,
          change: parseFloat(Math.abs(change).toFixed(2)),
        });

        // Top 10 Loss Check
        if (prevPos <= 10 && currPos > 10) {
          top10Losses.push(kw.keyword);
        }
      }
    }
  }

  const averagePosition = avgCurrentPosCount > 0 ? parseFloat((avgCurrentPosSum / avgCurrentPosCount).toFixed(2)) : 0.0;

  // Sorting Lists
  winnersList.sort((a, b) => b.change - a.change);
  losersList.sort((a, b) => b.change - a.change);
  strikingDistance.sort((a, b) => b.opportunityScore - a.opportunityScore);
  highImpLowCtr.sort((a, b) => b.impressions - a.impressions);

  return {
    totalTracked,
    activeKeywordsCount: avgCurrentPosCount,
    averagePosition,
    top3Count,
    top10Count,
    top20Count,
    improvedCount,
    declinedCount,
    winnersList: winnersList.slice(0, 10),
    losersList: losersList.slice(0, 10),
    top10Entrants: top10Entrants.slice(0, 10),
    top10Losses: top10Losses.slice(0, 10),
    strikingDistance: strikingDistance.slice(0, 10),
    highImpLowCtr: highImpLowCtr.slice(0, 10),
    positionGroups,
  };
};

export const logRankingActivity = async (
  actorEmail: string,
  action: string,
  clientId: string | number,
  clientName: string,
  metadata: unknown
) => {
  try {
    await prisma.activityLog.create({
      data: {
        actorEmail,
        action,
        clientId,
        clientName,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (err) {
    console.error("Failed to log Rankings activity:", err);
  }
};
