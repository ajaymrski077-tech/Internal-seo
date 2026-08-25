import prisma from "@/lib/db";
import { getPortfolioTotals, getClientTotals, getClientHistory, HistoryDataPoint, MetricDelta, getPreviousPeriodDates } from "./analyticsService";
import { getClientDeliveries, DeliveryDetail } from "./deliveryService";
import { getRankingsOverview } from "./rankingsService";

export interface ClientDashboardCard {
  id: string | number;
  name: string;
  companyName: string | null;
  domain: string;
  propertyName: string;
  initials: string;
  status: string;
  isArchived: boolean;
  hasGA4: boolean;
  hasGSC: boolean;
  ga4Status: string; // CONNECTED, SYNC_ERROR, DISCONNECTED
  gscStatus: string;
  ga4Error: string | null;
  gscError: string | null;
  lastSyncTime: string | null;
  metrics: MetricDelta | null;
  history: {
    current: HistoryDataPoint[];
    previous: HistoryDataPoint[];
  };
  deliveries: DeliveryDetail[];
}

export interface DashboardPayload {
  portfolio: MetricDelta;
  clients: ClientDashboardCard[];
  totalClientsCount: number;
}

// Date Range helper
export const parseRangeCode = (range: string): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "1y":
      start.setDate(end.getDate() - 365);
      break;
    case "30d":
    default:
      start.setDate(end.getDate() - 30);
      break;
  }
  return { start, end };
};

export const getDashboardData = async (
  search: string = "",
  range: string = "30d",
  showArchived: boolean = false,
  sort: string = "name_asc"
): Promise<DashboardPayload> => {
  const { start, end } = parseRangeCode(range);

  // 1. Get portfolio totals
  const portfolio = await getPortfolioTotals(start, end, showArchived);

  // 2. Fetch clients with properties & connections (excluding token credentials)
  const whereClause: any = {};
  
  if (!showArchived) {
    whereClause.isArchived = false;
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { companyName: { contains: search } },
      { properties: { some: { domain: { contains: search } } } },
    ];
  }

  const dbClients = await prisma.client.findMany({
    where: whereClause,
    include: {
      properties: {
        include: {
          connections: {
            select: {
              id: true,
              propertyId: true,
              provider: true,
              status: true,
              syncStatus: true,
              syncError: true,
              lastSyncTime: true,
              externalId: true,
              conversionEventName: true,
              createdAt: true,
              updatedAt: true
            }
          },
        },
      },
    },
  });

  const clientIds = dbClients.map((c: any) => c.id);
  const propertyIds = dbClients.flatMap((c: any) => (c.properties || []).map((p: any) => p.id));
  const prevDates = getPreviousPeriodDates(start, end);

  // Bulk query all deliveries for matching clients
  const allDeliveries = clientIds.length > 0 ? await prisma.deliveryEvent.findMany({
    where: {
      clientId: { in: clientIds },
      date: { gte: start, lte: end }
    },
    include: {
      client: { select: { name: true } },
      property: { select: { domain: true } },
      contentDetails: true,
      linkDetails: true
    },
    orderBy: { date: "desc" }
  }) : [];

  // Bulk query all snapshots for current and previous periods
  const currentSnapshots = propertyIds.length > 0 ? await prisma.analyticsSnapshot.findMany({
    where: {
      propertyId: { in: propertyIds },
      date: { gte: start, lte: end }
    },
    orderBy: { date: "asc" }
  }) : [];

  const previousSnapshots = propertyIds.length > 0 ? await prisma.analyticsSnapshot.findMany({
    where: {
      propertyId: { in: propertyIds },
      date: { gte: prevDates.start, lte: prevDates.end }
    },
    orderBy: { date: "asc" }
  }) : [];

  // Group deliveries in memory by client ID
  const deliveriesByClient: Record<string, DeliveryDetail[]> = {};
  for (const d of allDeliveries) {
    if (!deliveriesByClient[d.clientId]) {
      deliveriesByClient[d.clientId] = [];
    }
    deliveriesByClient[d.clientId].push({
      id: d.id,
      clientId: d.clientId,
      clientName: d.client.name,
      propertyId: d.propertyId,
      propertyDomain: d.property?.domain || null,
      type: d.type,
      date: d.date.toISOString(),
      description: d.description,
      contentDetails: d.contentDetails ? {
        title: d.contentDetails.title,
        url: d.contentDetails.url,
        wordCount: d.contentDetails.wordCount
      } : null,
      linkDetails: d.linkDetails ? {
        url: d.linkDetails.url,
        anchorText: d.linkDetails.anchorText,
        targetUrl: d.linkDetails.targetUrl,
        domainAuthority: d.linkDetails.domainAuthority
      } : null
    });
  }

  // Group snapshots in memory by property ID
  const currentSnapsByProperty: Record<string, typeof currentSnapshots> = {};
  for (const s of currentSnapshots) {
    if (!currentSnapsByProperty[s.propertyId]) {
      currentSnapsByProperty[s.propertyId] = [];
    }
    currentSnapsByProperty[s.propertyId].push(s);
  }

  const previousSnapsByProperty: Record<string, typeof previousSnapshots> = {};
  for (const s of previousSnapshots) {
    if (!previousSnapsByProperty[s.propertyId]) {
      previousSnapsByProperty[s.propertyId] = [];
    }
    previousSnapsByProperty[s.propertyId].push(s);
  }

  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  };

  const clientsList: ClientDashboardCard[] = [];

  // 3. Populate metrics and histories in memory
  for (const client of dbClients) {
    const primaryProperty = client.properties?.[0];
    
    const initials = client.name
      .split(" ")
      .map((n: any) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    if (!primaryProperty) {
      clientsList.push({
        id: client.id,
        name: client.name,
        companyName: client.companyName,
        domain: "no-property.com",
        propertyName: "No Property Configured",
        initials,
        status: client.status,
        isArchived: client.isArchived,
        hasGA4: false,
        hasGSC: false,
        ga4Status: "DISCONNECTED",
        gscStatus: "DISCONNECTED",
        ga4Error: null,
        gscError: null,
        lastSyncTime: null,
        metrics: null,
        history: { current: [], previous: [] },
        deliveries: [],
      });
      continue;
    }

    const ga4Conn = primaryProperty.connections?.find((c: any) => c.provider === "GA4");
    const gscConn = primaryProperty.connections?.find((c: any) => c.provider === "GSC");

    const ga4Status = ga4Conn ? ga4Conn.status : "DISCONNECTED";
    const gscStatus = gscConn ? gscConn.status : "DISCONNECTED";
    
    const ga4Error = ga4Conn ? ga4Conn.syncError : null;
    const gscError = gscConn ? gscConn.syncError : null;

    const hasGA4 = ga4Status === "CONNECTED" || ga4Status === "SYNC_ERROR";
    const hasGSC = gscStatus === "CONNECTED" || gscStatus === "SYNC_ERROR";

    let metrics: MetricDelta | null = null;
    let history = { current: [] as HistoryDataPoint[], previous: [] as HistoryDataPoint[] };
    let deliveries: DeliveryDetail[] = deliveriesByClient[client.id] || [];

    if (hasGA4 || hasGSC) {
      let currSessions = 0;
      let currOrganic = 0;
      let currConversions = 0;

      let prevSessions = 0;
      let prevOrganic = 0;
      let prevConversions = 0;

      const currHistoryMap: Record<string, HistoryDataPoint> = {};
      const prevHistoryMap: Record<string, HistoryDataPoint> = {};

      // Initialize date timelines to prevent gaps
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const currDate = new Date(start);
        currDate.setDate(currDate.getDate() + i);
        const currDateStr = currDate.toISOString().split("T")[0];
        currHistoryMap[currDateStr] = { date: currDateStr, sessions: 0, organicTraffic: 0, conversions: 0 };
        
        const prevDate = new Date(prevDates.start);
        prevDate.setDate(prevDate.getDate() + i);
        const prevDateStr = prevDate.toISOString().split("T")[0];
        prevHistoryMap[prevDateStr] = { date: prevDateStr, sessions: 0, organicTraffic: 0, conversions: 0 };
      }

      for (const prop of client.properties) {
        const propCurrSnaps = currentSnapsByProperty[prop.id] || [];
        for (const s of propCurrSnaps) {
          currSessions += s.sessions;
          currOrganic += s.organicTraffic;
          currConversions += s.conversions;

          const dateStr = s.date.toISOString().split("T")[0];
          if (currHistoryMap[dateStr]) {
            currHistoryMap[dateStr].sessions += s.sessions;
            currHistoryMap[dateStr].organicTraffic += s.organicTraffic;
            currHistoryMap[dateStr].conversions += s.conversions;
          }
        }

        const propPrevSnaps = previousSnapsByProperty[prop.id] || [];
        for (const s of propPrevSnaps) {
          prevSessions += s.sessions;
          prevOrganic += s.organicTraffic;
          prevConversions += s.conversions;

          const dateStr = s.date.toISOString().split("T")[0];
          if (prevHistoryMap[dateStr]) {
            prevHistoryMap[dateStr].sessions += s.sessions;
            prevHistoryMap[dateStr].organicTraffic += s.organicTraffic;
            prevHistoryMap[dateStr].conversions += s.conversions;
          }
        }
      }

      const currentHistory = Object.values(currHistoryMap).sort((a, b) => a.date.localeCompare(b.date));
      const previousHistory = Object.values(prevHistoryMap).sort((a, b) => a.date.localeCompare(b.date));

      metrics = {
        sessions: currSessions,
        organicTraffic: currOrganic,
        conversions: currConversions,
        sessionsChange: calculatePercentChange(currSessions, prevSessions),
        organicTrafficChange: calculatePercentChange(currOrganic, prevOrganic),
        conversionsChange: calculatePercentChange(currConversions, prevConversions),
      };

      history = {
        current: currentHistory.map((h) => ({
          date: h.date,
          sessions: hasGA4 ? h.sessions : 0,
          organicTraffic: hasGSC ? h.organicTraffic : 0,
          conversions: hasGA4 ? h.conversions : 0,
        })),
        previous: previousHistory.map((h) => ({
          date: h.date,
          sessions: hasGA4 ? h.sessions : 0,
          organicTraffic: hasGSC ? h.organicTraffic : 0,
          conversions: hasGA4 ? h.conversions : 0,
        })),
      };
    }

    const syncDates = [ga4Conn?.lastSyncTime, gscConn?.lastSyncTime].filter(Boolean) as Date[];
    let lastSyncTimeStr: string | null = null;
    if (syncDates.length > 0) {
      const maxDate = new Date(Math.max(...syncDates.map((d) => d.getTime())));
      lastSyncTimeStr = maxDate.toLocaleString();
    }

    clientsList.push({
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      domain: primaryProperty.domain,
      propertyName: primaryProperty.name,
      initials,
      status: client.status,
      isArchived: client.isArchived,
      hasGA4,
      hasGSC,
      ga4Status,
      gscStatus,
      ga4Error,
      gscError,
      lastSyncTime: lastSyncTimeStr,
      metrics,
      history,
      deliveries,
    });
  }

  // 4. Sort clients
  clientsList.sort((a, b) => {
    switch (sort) {
      case "name_desc":
        return b.name.localeCompare(a.name);
      
      case "traffic_desc":
        const trafficA = a.metrics?.sessions || 0;
        const trafficB = b.metrics?.sessions || 0;
        return trafficB - trafficA;

      case "traffic_asc":
        const tA = a.metrics?.sessions || 0;
        const tB = b.metrics?.sessions || 0;
        return tA - tB;

      case "growth_desc":
        const growthA = a.metrics?.sessionsChange || -999999;
        const growthB = b.metrics?.sessionsChange || -999999;
        return growthB - growthA;

      case "growth_asc":
        const gA = a.metrics?.sessionsChange || 999999;
        const gB = b.metrics?.sessionsChange || 999999;
        return gA - gB;

      case "name_asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return {
    portfolio,
    clients: clientsList,
    totalClientsCount: dbClients.length,
  };
};

export const getClientDashboardByShareToken = async (
  shareToken: string,
  range: string = "30d"
): Promise<ClientDashboardCard | null> => {
  const { start, end } = parseRangeCode(range);

  // 1. Fetch client by shareToken
  const client = (await prisma.client.findFirst({
    where: { shareToken, isArchived: false } as any,
    include: {
      properties: {
        include: {
          connections: {
            select: {
              id: true,
              propertyId: true,
              provider: true,
              status: true,
              syncStatus: true,
              syncError: true,
              lastSyncTime: true,
              externalId: true,
              conversionEventName: true,
              createdAt: true,
              updatedAt: true
            }
          },
        },
      },
    },
  })) as any;

  if (!client) return null;

  // Determine primary property
  const primaryProperty = client.properties[0];
  
  // Generate initials
  const initials = (client.name as string)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!primaryProperty) {
    return {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      domain: "no-property.com",
      propertyName: "No Property Configured",
      initials,
      status: client.status,
      isArchived: client.isArchived,
      hasGA4: false,
      hasGSC: false,
      ga4Status: "DISCONNECTED",
      gscStatus: "DISCONNECTED",
      ga4Error: null,
      gscError: null,
      lastSyncTime: null,
      metrics: null,
      history: { current: [], previous: [] },
      deliveries: [],
    };
  }

  // Connections check
  const ga4Conn = (primaryProperty.connections as any[]).find((c: any) => c.provider === "GA4");
  const gscConn = (primaryProperty.connections as any[]).find((c: any) => c.provider === "GSC");

  const ga4Status = ga4Conn ? ga4Conn.status : "DISCONNECTED";
  const gscStatus = gscConn ? gscConn.status : "DISCONNECTED";
  
  const ga4Error = ga4Conn ? ga4Conn.syncError : null;
  const gscError = gscConn ? gscConn.syncError : null;

  const hasGA4 = ga4Status === "CONNECTED" || ga4Status === "SYNC_ERROR";
  const hasGSC = gscStatus === "CONNECTED" || gscStatus === "SYNC_ERROR";

  let metrics: MetricDelta | null = null;
  let history = { current: [] as HistoryDataPoint[], previous: [] as HistoryDataPoint[] };
  let deliveries: DeliveryDetail[] = [];

  // Retrieve events (deliveries)
  deliveries = await getClientDeliveries(client.id, start, end);

  if (hasGA4 || hasGSC) {
    const rawMetrics = await getClientTotals(client.id, start, end);
    const prevDates = getPreviousPeriodDates(start, end);
    const currentHistory = await getClientHistory(client.id, start, end);
    const previousHistory = await getClientHistory(client.id, prevDates.start, prevDates.end);

    metrics = {
      sessions: hasGA4 ? rawMetrics.sessions : 0,
      organicTraffic: hasGSC ? rawMetrics.organicTraffic : 0,
      conversions: hasGA4 ? rawMetrics.conversions : 0,
      sessionsChange: hasGA4 ? rawMetrics.sessionsChange : 0,
      organicTrafficChange: hasGSC ? rawMetrics.organicTrafficChange : 0,
      conversionsChange: hasGA4 ? rawMetrics.conversionsChange : 0,
    };

    history = {
      current: currentHistory.map((h) => ({
        date: h.date,
        sessions: hasGA4 ? h.sessions : 0,
        organicTraffic: hasGSC ? h.organicTraffic : 0,
        conversions: hasGA4 ? h.conversions : 0,
      })),
      previous: previousHistory.map((h) => ({
        date: h.date,
        sessions: hasGA4 ? h.sessions : 0,
        organicTraffic: hasGSC ? h.organicTraffic : 0,
        conversions: hasGA4 ? h.conversions : 0,
      })),
    };
  }

  // Get last sync time
  const syncDates = [ga4Conn?.lastSyncTime, gscConn?.lastSyncTime].filter(Boolean) as Date[];
  let lastSyncTimeStr: string | null = null;
  if (syncDates.length > 0) {
    const maxDate = new Date(Math.max(...syncDates.map((d) => d.getTime())));
    lastSyncTimeStr = maxDate.toLocaleString();
  }

  return {
    id: client.id,
    name: client.name,
    companyName: client.companyName,
    domain: primaryProperty.domain,
    propertyName: primaryProperty.name,
    initials,
    status: client.status,
    isArchived: client.isArchived,
    hasGA4,
    hasGSC,
    ga4Status,
    gscStatus,
    ga4Error,
    gscError,
    lastSyncTime: lastSyncTimeStr,
    metrics,
    history,
    deliveries,
  };
};



export const getClientWorkspaceData = async (
  clientId: string | number,
  range: string = "30d"
): Promise<any | null> => {
  const { start, end } = parseRangeCode(range);

  // 1. Fetch client with property & connections
  const client = (await prisma.client.findFirst({
    where: { id: clientId },
    include: {
      properties: {
        include: {
          connections: true,
        },
      },
      deliveryEvents: {
        include: {
          contentDetails: true,
          linkDetails: true,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
  })) as any;

  if (!client) return null;

  // Determine primary property
  const primaryProperty = client.properties[0];
  
  // Generate initials
  const initials = client.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ga4Conn = (primaryProperty?.connections as any[] | undefined)?.find((c: any) => c.provider === "GA4");
  const gscConn = (primaryProperty?.connections as any[] | undefined)?.find((c: any) => c.provider === "GSC");
  const gbpConn = (primaryProperty?.connections as any[] | undefined)?.find((c: any) => c.provider === "GBP");

  const ga4Status = ga4Conn ? ga4Conn.status : "DISCONNECTED";
  const gscStatus = gscConn ? gscConn.status : "DISCONNECTED";
  const gbpStatus = gbpConn ? gbpConn.status : "DISCONNECTED";
  
  const ga4Error = ga4Conn ? ga4Conn.syncError : null;
  const gscError = gscConn ? gscConn.syncError : null;
  const gbpError = gbpConn ? gbpConn.syncError : null;

  const hasGA4 = ga4Status === "CONNECTED" || ga4Status === "SYNC_ERROR";
  const hasGSC = gscStatus === "CONNECTED" || gscStatus === "SYNC_ERROR";

  let metrics: MetricDelta | null = null;
  let history = { current: [] as HistoryDataPoint[], previous: [] as HistoryDataPoint[] };
  let deliveries: DeliveryDetail[] = [];

  // Retrieve deliveries for the selected period
  deliveries = await getClientDeliveries(client.id, start, end);

  if (hasGA4 || hasGSC) {
    const rawMetrics = await getClientTotals(client.id, start, end);
    const prevDates = getPreviousPeriodDates(start, end);
    const currentHistory = await getClientHistory(client.id, start, end);
    const previousHistory = await getClientHistory(client.id, prevDates.start, prevDates.end);

    metrics = {
      sessions: hasGA4 ? rawMetrics.sessions : 0,
      organicTraffic: hasGSC ? rawMetrics.organicTraffic : 0,
      conversions: hasGA4 ? rawMetrics.conversions : 0,
      sessionsChange: hasGA4 ? rawMetrics.sessionsChange : 0,
      organicTrafficChange: hasGSC ? rawMetrics.organicTrafficChange : 0,
      conversionsChange: hasGA4 ? rawMetrics.conversionsChange : 0,
    };

    history = {
      current: currentHistory.map((h) => ({
        date: h.date,
        sessions: hasGA4 ? h.sessions : 0,
        organicTraffic: hasGSC ? h.organicTraffic : 0,
        conversions: hasGA4 ? h.conversions : 0,
      })),
      previous: previousHistory.map((h) => ({
        date: h.date,
        sessions: hasGA4 ? h.sessions : 0,
        organicTraffic: hasGSC ? h.organicTraffic : 0,
        conversions: hasGA4 ? h.conversions : 0,
      })),
    };
  }

  // Get last sync time
  const syncDates = [ga4Conn?.lastSyncTime, gscConn?.lastSyncTime, gbpConn?.lastSyncTime].filter(Boolean) as Date[];
  let lastSyncTimeStr: string | null = null;
  if (syncDates.length > 0) {
    const maxDate = new Date(Math.max(...syncDates.map((d) => d.getTime())));
    lastSyncTimeStr = maxDate.toLocaleString();
  }

  // Fetch recent activity logs
  const activityLogs = await (prisma as any).activityLog.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Fetch client-specific Digital PR stats
  const [activePrCampaigns, prOutreachCount, prPlacementsCount, contactedCount, responsesCount] = await Promise.all([
    prisma.prCampaign.count({ where: { clientId: client.id, status: "ACTIVE" } }),
    prisma.prOutreachRecord.count({ where: { campaign: { clientId: client.id } } }),
    prisma.prPlacement.count({ where: { campaign: { clientId: client.id } } }),
    prisma.prOutreachRecord.count({ where: { campaign: { clientId: client.id }, outreachStatus: { not: "NOT_CONTACTED" } } }),
    prisma.prOutreachRecord.count({ where: { campaign: { clientId: client.id }, outreachStatus: { in: ["RESPONDED", "INTERESTED", "PUBLISHED", "REJECTED"] } } }),
  ]);
  const prResponseRate = contactedCount > 0 ? (responsesCount / contactedCount) * 100 : 0;

  // Fetch client-specific Link Building stats
  const [activeLinkCampaigns, linkOpportunitiesCount, acquiredLinksCount, liveLinksCount, attentionLinksCount] = await Promise.all([
    prisma.linkCampaign.count({ where: { clientId: client.id, status: "ACTIVE" } }),
    prisma.linkOpportunity.count({ where: { campaign: { clientId: client.id }, status: "QUALIFIED" } }),
    prisma.acquiredBacklink.count({ where: { campaign: { clientId: client.id } } }),
    prisma.acquiredBacklink.count({ where: { campaign: { clientId: client.id }, status: "LIVE" } }),
    prisma.acquiredBacklink.count({ where: { campaign: { clientId: client.id }, status: { in: ["MISSING", "BROKEN"] } } }),
  ]);

  // Fetch client-specific rankings stats
  const rankingsOverview = await getRankingsOverview(client.id);

  // Fetch client-specific On-Page SEO stats
  const latestAudit = await prisma.seoAudit.findFirst({
    where: { property: { clientId: client.id } },
    orderBy: { createdAt: "desc" },
  });

  // Fetch GBP Location mapping
  const gbpLocation = primaryProperty ? await prisma.gbpLocation.findUnique({
    where: { propertyId: primaryProperty.id },
    include: { snapshots: { orderBy: { date: "desc" }, take: 1 } }
  }) : null;

  return {
    client: {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      logoUrl: client.logoUrl,
      status: client.status,
      isArchived: client.isArchived,
      shareToken: client.shareToken,
      managerName: client.managerName,
      notes: client.notes,
      startDate: client.startDate?.toISOString() || null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      properties: (client.properties as any[]).map((p: any) => ({
        id: p.id,
        domain: p.domain,
        name: p.name,
        connections: (p.connections as any[]).map((c: any) => ({
          id: c.id,
          provider: c.provider,
          status: c.status,
          syncStatus: c.syncStatus,
          syncError: c.syncError,
          lastSyncTime: c.lastSyncTime?.toISOString() || null,
          externalId: c.externalId,
          conversionEventName: c.conversionEventName,
        }))
      })),
    },
    domain: primaryProperty ? primaryProperty.domain : "no-website.com",
    initials,
    ga4Status,
    gscStatus,
    gbpStatus,
    ga4Error,
    gscError,
    gbpError,
    lastSyncTime: lastSyncTimeStr,
    metrics,
    history,
    deliveries,
    activityLogs,
    prStats: {
      activeCampaigns: activePrCampaigns,
      totalOutreach: prOutreachCount,
      publishedPlacements: prPlacementsCount,
      responseRate: prResponseRate,
    },
    linkStats: {
      activeCampaigns: activeLinkCampaigns,
      qualifiedOpportunities: linkOpportunitiesCount,
      acquiredLinks: acquiredLinksCount,
      liveLinks: liveLinksCount,
      attentionLinks: attentionLinksCount,
    },
    rankingStats: {
      trackedKeywords: rankingsOverview.totalTracked,
      averagePosition: rankingsOverview.averagePosition,
      top3Count: rankingsOverview.top3Count,
      top10Count: rankingsOverview.top10Count,
      improvedKeywords: rankingsOverview.improvedCount,
      declinedKeywords: rankingsOverview.declinedCount,
    },
    onpageStats: latestAudit ? {
      id: latestAudit.id,
      score: latestAudit.score,
      status: latestAudit.status,
      pagesCrawled: latestAudit.pagesCrawled,
      issuesCritical: latestAudit.issuesCritical,
      createdAt: latestAudit.createdAt.toISOString()
    } : null,
    gbpStats: gbpLocation ? {
      id: gbpLocation.id,
      displayName: gbpLocation.displayName,
      primaryCategory: gbpLocation.primaryCategory,
      syncStatus: gbpLocation.syncStatus,
      lastSyncTime: gbpLocation.lastSyncTime?.toISOString() || null,
      latestMetrics: gbpLocation.snapshots[0] ? {
        viewsSearch: gbpLocation.snapshots[0].viewsSearch,
        viewsMaps: gbpLocation.snapshots[0].viewsMaps,
        clicksWebsite: gbpLocation.snapshots[0].clicksWebsite,
        clicksCall: gbpLocation.snapshots[0].clicksCall,
        clicksDirections: gbpLocation.snapshots[0].clicksDirections,
      } : null
    } : null,
  };
};
