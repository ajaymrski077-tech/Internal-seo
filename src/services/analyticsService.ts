import prisma from "@/lib/db";

export interface MetricsSummary {
  sessions: number;
  organicTraffic: number;
  conversions: number;
}

export interface MetricDelta extends MetricsSummary {
  sessionsChange: number; // percentage change, e.g. 12.5%
  organicTrafficChange: number;
  conversionsChange: number;
}

export interface HistoryDataPoint {
  date: string;
  sessions: number;
  organicTraffic: number;
  conversions: number;
}

export const getPreviousPeriodDates = (startDate: Date, endDate: Date): { start: Date; end: Date } => {
  const durationMs = endDate.getTime() - startDate.getTime();
  
  // Previous period starts durationMs before the current start date, and ends durationMs before current end date
  const prevStartDate = new Date(startDate.getTime() - durationMs - 1000); // 1s buffer
  const prevEndDate = new Date(startDate.getTime() - 1000);

  return { start: prevStartDate, end: prevEndDate };
};

const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

export const getPortfolioTotals = async (
  startDate: Date,
  endDate: Date,
  includeArchived: boolean = false
): Promise<MetricDelta> => {
  const prevDates = getPreviousPeriodDates(startDate, endDate);

  // Define client status filter relative to property's client
  const propertyFilter = includeArchived ? {} : { client: { isArchived: false } };

  // Current period totals
  const currentAgg = await prisma.analyticsSnapshot.aggregate({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      property: propertyFilter,
    },
    _sum: {
      sessions: true,
      organicTraffic: true,
      conversions: true,
    },
  });

  // Previous period totals
  const prevAgg = await prisma.analyticsSnapshot.aggregate({
    where: {
      date: {
        gte: prevDates.start,
        lte: prevDates.end,
      },
      property: propertyFilter,
    },
    _sum: {
      sessions: true,
      organicTraffic: true,
      conversions: true,
    },
  });

  const currSum = {
    sessions: currentAgg._sum.sessions || 0,
    organicTraffic: currentAgg._sum.organicTraffic || 0,
    conversions: currentAgg._sum.conversions || 0,
  };

  const prevSum = {
    sessions: prevAgg._sum.sessions || 0,
    organicTraffic: prevAgg._sum.organicTraffic || 0,
    conversions: prevAgg._sum.conversions || 0,
  };

  return {
    ...currSum,
    sessionsChange: calculatePercentChange(currSum.sessions, prevSum.sessions),
    organicTrafficChange: calculatePercentChange(currSum.organicTraffic, prevSum.organicTraffic),
    conversionsChange: calculatePercentChange(currSum.conversions, prevSum.conversions),
  };
};

export const getClientTotals = async (
  clientId: string | number,
  startDate: Date,
  endDate: Date
): Promise<MetricDelta> => {
  const prevDates = getPreviousPeriodDates(startDate, endDate);

  const properties = await prisma.websiteProperty.findMany({
    where: { clientId: clientId.toString() },
    select: { id: true }
  });
  const propertyIds = properties.map((p: any) => p.id);

  if (propertyIds.length === 0) {
    return {
      sessions: 0,
      organicTraffic: 0,
      conversions: 0,
      sessionsChange: 0,
      organicTrafficChange: 0,
      conversionsChange: 0,
    };
  }

  // Current period aggregates
  const currentAgg = await prisma.analyticsSnapshot.aggregate({
    where: {
      propertyId: { in: propertyIds },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      sessions: true,
      organicTraffic: true,
      conversions: true,
    },
  });

  // Previous period aggregates
  const prevAgg = await prisma.analyticsSnapshot.aggregate({
    where: {
      propertyId: { in: propertyIds },
      date: {
        gte: prevDates.start,
        lte: prevDates.end,
      },
    },
    _sum: {
      sessions: true,
      organicTraffic: true,
      conversions: true,
    },
  });

  const currSum = {
    sessions: currentAgg._sum?.sessions || 0,
    organicTraffic: currentAgg._sum?.organicTraffic || 0,
    conversions: currentAgg._sum?.conversions || 0,
  };

  const prevSum = {
    sessions: prevAgg._sum?.sessions || 0,
    organicTraffic: prevAgg._sum?.organicTraffic || 0,
    conversions: prevAgg._sum?.conversions || 0,
  };

  return {
    ...currSum,
    sessionsChange: calculatePercentChange(currSum.sessions, prevSum.sessions),
    organicTrafficChange: calculatePercentChange(currSum.organicTraffic, prevSum.organicTraffic),
    conversionsChange: calculatePercentChange(currSum.conversions, prevSum.conversions),
  };
};

export const getClientHistory = async (
  clientId: string | number,
  startDate: Date,
  endDate: Date
): Promise<HistoryDataPoint[]> => {
  const properties = await prisma.websiteProperty.findMany({
    where: { clientId: clientId.toString() },
    select: { id: true }
  });
  const propertyIds = properties.map((p: any) => p.id);

  const snapshots = propertyIds.length > 0 ? await prisma.analyticsSnapshot.findMany({
    where: {
      propertyId: { in: propertyIds },
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  }) : [];

  // Aggregate by date (in case a client has multiple properties)
  const historyMap: Record<string, HistoryDataPoint> = {};

  // 1. Initialize map for every date in range to align timelines and prevent gaps
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  for (let i = 0; i <= daysDiff; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    historyMap[dateStr] = {
      date: dateStr,
      sessions: 0,
      organicTraffic: 0,
      conversions: 0,
    };
  }

  // 2. Populate with actual database snapshot data
  for (const s of snapshots) {
    const dateStr = s.date.toISOString().split("T")[0];
    if (historyMap[dateStr]) {
      historyMap[dateStr].sessions += s.sessions;
      historyMap[dateStr].organicTraffic += s.organicTraffic;
      historyMap[dateStr].conversions += s.conversions;
    }
  }

  return Object.values(historyMap).sort((a, b) => a.date.localeCompare(b.date));
};

// Import google APIs
import { getGa4Client, getGscClient, getDecryptedCredentials } from "./googleApiService";
import { syncPropertyKeywords } from "./rankingsService";

export const syncPropertyData = async (propertyId: number, daysToSync: number = 30) => {
  const property = await prisma.websiteProperty.findUnique({
    where: { id: propertyId },
    include: { connections: true }
  });
  if (!property) throw new Error("Property not found");

  const ga4Conn = property.connections.find((c: any) => c.provider === "GA4");
  const gscConn = property.connections.find((c: any) => c.provider === "GSC");

  if (!ga4Conn && !gscConn) return;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysToSync);

  // We'll store metrics per day
  const dailyMetrics: Record<string, { sessions: number, conversions: number, organicTraffic: number, gscImpressions: number, gscPosition: number }> = {};

  for (let i = 0; i <= daysToSync; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    dailyMetrics[dateStr] = { sessions: 0, conversions: 0, organicTraffic: 0, gscImpressions: 0, gscPosition: 0 };
  }

  // 1. Fetch GA4 Data
  if (ga4Conn && ga4Conn.externalId) {
    try {
      const { accessToken, refreshToken } = await getDecryptedCredentials(ga4Conn.id);
      if (accessToken) {
        const analyticsDataClient = getGa4Client(ga4Conn.id, accessToken, refreshToken || undefined);
        
        const response = await analyticsDataClient.properties.runReport({
          property: `properties/${ga4Conn.externalId}`,
          requestBody: {
            dateRanges: [{ startDate: startDate.toISOString().split("T")[0], endDate: "today" }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "sessions" }, { name: "conversions" }]
          }
        });

        if (response.data.rows) {
          for (const row of response.data.rows) {
            const dateDim = row.dimensionValues?.[0]?.value; // YYYYMMDD
            if (dateDim && dateDim.length === 8) {
              const formattedDate = `${dateDim.slice(0, 4)}-${dateDim.slice(4, 6)}-${dateDim.slice(6, 8)}`;
              if (dailyMetrics[formattedDate]) {
                dailyMetrics[formattedDate].sessions = parseInt(row.metricValues?.[0]?.value || "0", 10);
                dailyMetrics[formattedDate].conversions = parseInt(row.metricValues?.[1]?.value || "0", 10);
              }
            }
          }
        }
        
        // Update sync status
        await prisma.integrationConnection.update({
          where: { id: ga4Conn.id },
          data: { syncStatus: "SUCCESS", lastSyncTime: new Date() }
        });
      }
    } catch (err: any) {
      console.error("GA4 Sync Error:", err);
      await prisma.integrationConnection.update({
        where: { id: ga4Conn.id },
        data: { syncStatus: "FAILED", syncError: err.message, status: "SYNC_ERROR" }
      });
    }
  }

  // 2. Fetch GSC Data
  if (gscConn && gscConn.externalId) {
    try {
      const { accessToken, refreshToken } = await getDecryptedCredentials(gscConn.id);
      if (accessToken) {
        const gscClient = getGscClient(gscConn.id, accessToken, refreshToken || undefined);
        
        const response = await gscClient.searchanalytics.query({
          siteUrl: gscConn.externalId,
          requestBody: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            dimensions: ["date"]
          }
        });

        if (response.data.rows) {
          for (const row of response.data.rows) {
            const dateVal = row.keys?.[0]; // YYYY-MM-DD
            if (dateVal && dailyMetrics[dateVal]) {
              dailyMetrics[dateVal].organicTraffic = row.clicks || 0;
              dailyMetrics[dateVal].gscImpressions = row.impressions || 0;
              dailyMetrics[dateVal].gscPosition = row.position || 0.0;
            }
          }
        }

        // Update sync status
        await prisma.integrationConnection.update({
          where: { id: gscConn.id },
          data: { syncStatus: "SUCCESS", lastSyncTime: new Date() }
        });

        // Sync Tracked Keywords
        try {
          await syncPropertyKeywords(property.id, daysToSync);
        } catch (kwErr) {
          console.error("Failed to sync property keywords:", kwErr);
        }
      }
    } catch (err: any) {
      console.error("GSC Sync Error:", err);
      await prisma.integrationConnection.update({
        where: { id: gscConn.id },
        data: { syncStatus: "FAILED", syncError: err.message, status: "SYNC_ERROR" }
      });
    }
  }

  // 3. Upsert into AnalyticsSnapshot
  for (const [dateStr, metrics] of Object.entries(dailyMetrics)) {
    const dateObj = new Date(dateStr);
    
    // Attempt upsert
    const existing = await prisma.analyticsSnapshot.findUnique({
      where: {
        propertyId_date: {
          propertyId: property.id,
          date: dateObj
        }
      }
    });

    if (existing) {
      await prisma.analyticsSnapshot.update({
        where: { id: existing.id },
        data: {
          sessions: ga4Conn ? metrics.sessions : existing.sessions,
          conversions: ga4Conn ? metrics.conversions : existing.conversions,
          organicTraffic: gscConn ? metrics.organicTraffic : existing.organicTraffic,
          gscImpressions: gscConn ? metrics.gscImpressions : existing.gscImpressions,
          gscPosition: gscConn ? metrics.gscPosition : existing.gscPosition
        }
      });
    } else {
      await prisma.analyticsSnapshot.create({
        data: {
          propertyId: property.id,
          date: dateObj,
          sessions: metrics.sessions,
          conversions: metrics.conversions,
          organicTraffic: metrics.organicTraffic,
          gscImpressions: metrics.gscImpressions,
          gscPosition: metrics.gscPosition
        }
      });
    }
  }
};

