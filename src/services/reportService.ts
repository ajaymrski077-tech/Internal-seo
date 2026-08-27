import prisma from "@/lib/db";
import { getClientTotals, getClientHistory } from "@/services/analyticsService";
import { getClientDeliveries } from "@/services/deliveryService";
import { parseRangeCode } from "@/services/dashboardService";
import crypto from "crypto";
import { getRankingsOverview } from "./rankingsService";
import { IntegrationConnectionRecord } from "@/types/db";

const db = prisma;

export interface ReportConfigInput {
  clientId: string | number;
  propertyId: string | number | null;
  name: string;
  dateRange: string;
  startDate?: Date;
  endDate?: Date;
  comparisonRange: string;
  sections: string[]; // e.g. ["overview", "sessions", "organic", "conversions", "deliveries"]
}

// 1. Get filtered, sorted, paginated reports list
export const getReportsList = async (params: {
  search?: string;
  clientId?: string | number;
  status?: string;
  isArchived?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
} = {}) => {
  const {
    search = "",
    clientId,
    status = "ALL",
    isArchived = false,
    sort = "newest",
    page = 1,
    pageSize = 10,
  } = params;

  const skip = (page - 1) * pageSize;

  // Build prisma where clause
  const whereClause: Record<string, unknown> = {
    isArchived,
  };

  if (clientId && clientId !== "ALL") {
    whereClause.clientId = clientId;
  }

  if (status !== "ALL") {
    whereClause.status = status;
  }

  if (search.trim()) {
    whereClause.OR = [
      { name: { contains: search } },
      { client: { name: { contains: search } } },
      { property: { domain: { contains: search } } },
    ];
  }

  // Sort logic mapping
  let orderBy: Record<string, string | Record<string, string>> = { createdAt: "desc" };
  if (sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "updated") {
    orderBy = { updatedAt: "desc" };
  } else if (sort === "client_name") {
    orderBy = { client: { name: "asc" } };
  } else if (sort === "report_name") {
    orderBy = { name: "asc" };
  }

  // Query records
  const [reports, totalCount] = await Promise.all([
    db.report.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, companyName: true },
        },
        property: {
          select: { id: true, domain: true, name: true },
        },
        snapshots: {
          orderBy: { generatedAt: "desc" },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    db.report.count({ where: whereClause }),
  ]);

  return {
    reports,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

// 2. Create report record
export const createReport = async (input: ReportConfigInput, actorEmail: string) => {
  const { clientId, propertyId, name, dateRange, startDate, endDate, comparisonRange, sections } = input;

  // Verify client exists
  const client = await prisma.client.findFirst({
    where: { id: clientId },
  });
  if (!client) throw new Error("Client not found.");

  // Parse dates
  let start = startDate || new Date();
  let end = endDate || new Date();
  if (dateRange !== "custom") {
    const parsed = parseRangeCode(dateRange);
    start = parsed.start;
    end = parsed.end;
  }

  // Create report
  const report = await prisma.$transaction(async (tx) => {
    const record = await tx.report.create({
      data: {
        clientId,
        propertyId,
        name,
        dateRange,
        startDate: start,
        endDate: end,
        comparisonRange,
        sections: JSON.stringify(sections),
        status: "DRAFT",
        shareToken: crypto.randomUUID(),
      },
    });

    // Log Activity
    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "REPORT_CREATED",
        clientId,
        clientName: client.name,
        metadata: JSON.stringify({ reportId: record.id, name }),
      },
    });

    return record;
  });

  return report;
};

// 3. Generate snapshot (immutable data record)
export const generateReportSnapshot = async (reportId: string | number, actorEmail: string) => {
  // 1. Fetch report details
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      client: true,
      property: true,
    },
  });

  if (!report) throw new Error("Report not found.");

  // Concurrency guard: reject if already generating
  if (report.status === "GENERATING") {
    throw new Error("Report snapshot generation is already in progress.");
  }

  // Mark generating
  await db.report.update({
    where: { id: reportId },
    data: { status: "GENERATING" },
  });

  try {
    let start = report.startDate;
    let end = report.endDate;
    if (report.dateRange !== "custom") {
      const parsed = parseRangeCode(report.dateRange);
      start = parsed.start;
      end = parsed.end;
    }

    // Determine GSC and GA4 connections status to prevent querying mock details if not connected
    const primaryProperty = await prisma.websiteProperty.findFirst({
      where: { clientId: report.clientId },
      include: {
        connections: {
          select: { id: true, provider: true, status: true },
        },
      },
    });

    const ga4Conn = primaryProperty?.connections?.find((c: IntegrationConnectionRecord) => c.provider === "GA4");
    const gscConn = primaryProperty?.connections?.find((c: IntegrationConnectionRecord) => c.provider === "GSC");

    const hasGA4 = ga4Conn?.status === "CONNECTED" || ga4Conn?.status === "SYNC_ERROR";
    const hasGSC = gscConn?.status === "CONNECTED" || gscConn?.status === "SYNC_ERROR";

    // Fetch aggregates
    let metrics = {
      sessions: 0,
      organicTraffic: 0,
      conversions: 0,
      sessionsChange: 0,
      organicTrafficChange: 0,
      conversionsChange: 0,
    };

    let history = {
      current: [] as Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }>,
      previous: [] as Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }>,
    };

    if (hasGA4 || hasGSC) {
      const rawMetrics = await getClientTotals(report.clientId, start, end);
      metrics = {
        sessions: hasGA4 ? rawMetrics.sessions : 0,
        organicTraffic: hasGSC ? rawMetrics.organicTraffic : 0,
        conversions: hasGA4 ? rawMetrics.conversions : 0,
        sessionsChange: hasGA4 ? rawMetrics.sessionsChange : 0,
        organicTrafficChange: hasGSC ? rawMetrics.organicTrafficChange : 0,
        conversionsChange: hasGA4 ? rawMetrics.conversionsChange : 0,
      };

      // Fetch history timelines
      const currentHistory = await getClientHistory(report.clientId, start, end);
      
      let prevHistory: Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }> = [];
      if (report.comparisonRange !== "NONE") {
        const duration = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - duration);
        const prevEnd = new Date(start.getTime());
        prevHistory = await getClientHistory(report.clientId, prevStart, prevEnd);
      }

      history = {
        current: currentHistory.map(h => ({
          date: h.date,
          sessions: hasGA4 ? h.sessions : 0,
          organicTraffic: hasGSC ? h.organicTraffic : 0,
          conversions: hasGA4 ? h.conversions : 0,
        })),
        previous: prevHistory.map(h => ({
          date: h.date,
          sessions: hasGA4 ? h.sessions : 0,
          organicTraffic: hasGSC ? h.organicTraffic : 0,
          conversions: hasGA4 ? h.conversions : 0,
        })),
      };
    }

    // Fetch completed campaign deliveries
    const deliveries = await getClientDeliveries(report.clientId, start, end);

    // Fetch Rankings snapshot
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const rankingsOverview = await getRankingsOverview(report.clientId, report.propertyId || undefined, durationDays || 30);
    const rankingsData = {
      trackedKeywords: rankingsOverview.totalTracked,
      averagePosition: rankingsOverview.averagePosition,
      top3Count: rankingsOverview.top3Count,
      top10Count: rankingsOverview.top10Count,
      winnersList: rankingsOverview.winnersList,
      losersList: rankingsOverview.losersList,
      positionGroups: rankingsOverview.positionGroups,
    };

    // Save snapshot
    const snapshot = await prisma.$transaction(async (tx) => {
      const snap = await tx.reportSnapshot.create({
        data: {
          reportId,
          metricsJson: JSON.stringify(metrics),
          historyJson: JSON.stringify(history),
          deliveriesJson: JSON.stringify(deliveries),
          rankingsJson: JSON.stringify(rankingsData),
        },
      });

      // Update report status
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: "READY",
          startDate: start,
          endDate: end,
        },
      });

      // Log Activity
      await tx.activityLog.create({
        data: {
          actorEmail,
          action: "REPORT_GENERATED",
          clientId: report.clientId,
          clientName: report.client?.name,
          metadata: JSON.stringify({ reportId, snapshotId: snap.id }),
        },
      });

      return snap;
    });

    return snapshot;
  } catch (err: unknown) {
    console.error("Report snapshot generation error:", err);
    await db.report.update({
      where: { id: reportId },
      data: { status: "FAILED" },
    });
    throw err;
  }
};

// 4. Update configuration
export const updateReportConfig = async (
  reportId: string | number,
  input: Partial<ReportConfigInput>,
  actorEmail: string
) => {
  const existing = await db.report.findUnique({
    where: { id: reportId },
    include: { client: true },
  });
  if (!existing) throw new Error("Report not found.");

  const { name, dateRange, startDate, endDate, comparisonRange, sections, propertyId } = input;

  let start = startDate || existing.startDate;
  let end = endDate || existing.endDate;
  if (dateRange && dateRange !== "custom") {
    const parsed = parseRangeCode(dateRange);
    start = parsed.start;
    end = parsed.end;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.report.update({
      where: { id: reportId },
      data: {
        name: name || existing.name,
        dateRange: dateRange || existing.dateRange,
        startDate: start,
        endDate: end,
        comparisonRange: comparisonRange || existing.comparisonRange,
        sections: sections ? JSON.stringify(sections) : existing.sections,
        propertyId: propertyId !== undefined ? propertyId : existing.propertyId,
        status: "DRAFT", // Mark Draft requiring regeneration
      },
    });

    // Log Activity
    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "REPORT_UPDATED",
        clientId: existing.clientId,
        clientName: existing.client?.name || "Client",
        metadata: JSON.stringify({ reportId, changes: Object.keys(input) }),
      },
    });

    return record;
  });

  return updated;
};

// 5. Get report with its latest snapshot details
export const getReportDetails = async (reportId: string | number) => {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      client: {
        include: {
          properties: true,
        },
      },
      property: true,
      snapshots: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  return report;
};

// 6. Archive/soft-delete report
export const archiveReport = async (reportId: string | number, actorEmail: string) => {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { client: true },
  });
  if (!report) throw new Error("Report not found.");

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: { isArchived: true },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "REPORT_ARCHIVED",
        clientId: report.clientId,
        clientName: report.client?.name || "Client",
        metadata: JSON.stringify({ reportId }),
      },
    });
  });

  return true;
};

// 7. Restore archived report
export const restoreReport = async (reportId: string | number, actorEmail: string) => {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { client: true },
  });
  if (!report) throw new Error("Report not found.");

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: { isArchived: false, status: "READY" },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "REPORT_RESTORED",
        clientId: report.clientId,
        clientName: report.client?.name || "Client",
        metadata: JSON.stringify({ reportId }),
      },
    });
  });

  return true;
};

// 8. Regenerate share token
export const regenerateReportShareToken = async (reportId: string | number, actorEmail: string) => {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { client: true },
  });
  if (!report) throw new Error("Report not found.");

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.report.update({
      where: { id: reportId },
      data: { shareToken: crypto.randomUUID() },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        actorEmail,
        action: "SHARE_LINK_REGENERATED",
        clientId: report.clientId,
        clientName: report.client?.name || "Client",
        metadata: JSON.stringify({ reportId, target: "REPORT" }),
      },
    });

    return record;
  });

  return updated;
};

// 9. Fetch shared report details via token (no auth required)
export const getSharedReportDetails = async (shareToken: string) => {
  const report = await db.report.findUnique({
    where: { shareToken, isArchived: false },
    include: {
      client: {
        select: { id: true, name: true, companyName: true, logoUrl: true },
      },
      property: {
        select: { domain: true, name: true },
      },
      snapshots: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!report) return null;

  // Also fetch all previous reports for this client to populate sidebar
  const previousReports = await db.report.findMany({
    where: { clientId: report.clientId, isArchived: false },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      shareToken: true,
    },
  });

  return {
    ...report,
    previousReports,
  };
};

// 10. Get clients reports summary for main /admin/reports directory view
export const getClientsReportsSummary = async (search?: string, showArchived: boolean = false) => {
  const whereClient: Record<string, unknown> = {
    isArchived: showArchived,
  };

  if (search && search.trim()) {
    whereClient.OR = [
      { name: { contains: search } },
      { properties: { some: { domain: { contains: search } } } },
    ];
  }

  const clients = await db.client.findMany({
    where: whereClient,
    include: {
      properties: {
        take: 1,
        select: { id: true, domain: true },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          status: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return clients.map((c) => {
    const totalReports = c.reports.length;
    const mostRecent = c.reports[0] || null;
    return {
      id: c.id,
      name: c.name,
      domain: c.properties[0]?.domain || "example.com",
      totalReports,
      mostRecentReport: mostRecent
        ? {
            id: mostRecent.id,
            name: mostRecent.name,
            startDate: mostRecent.startDate,
            endDate: mostRecent.endDate,
            createdAt: mostRecent.createdAt,
          }
        : null,
    };
  });
};

// 11. Get Client Reports Management Workspace for /admin/reports/[clientId]
export const getClientReportsWorkspace = async (clientId: string) => {
  const client = await db.client.findUnique({
    where: { id: clientId },
    include: {
      properties: {
        take: 1,
        select: { id: true, domain: true },
      },
    },
  });

  if (!client) throw new Error("Client not found.");

  // Fetch all reports for this client
  const reports = await db.report.findMany({
    where: { clientId },
    include: {
      snapshots: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { startDate: "desc" },
  });

  // Fetch all deliveries to compute all-time counts
  const allDeliveries = await db.deliveryEvent.findMany({
    where: { clientId },
  });

  const backlinksCount = allDeliveries.filter((d) => d.type === "BACKLINK").length;
  const contentCount = allDeliveries.filter((d) => d.type === "CONTENT").length;

  // Process reports ledger items
  const reportsLedger = reports.map((r) => {
    let metrics = {
      sessions: 0,
      sessionsChange: 0,
      organicTraffic: 0,
      organicTrafficChange: 0,
      conversions: 0,
    };
    let deliveriesList: Array<{ type: string }> = [];

    if (r.snapshots[0]) {
      try {
        metrics = JSON.parse(r.snapshots[0].metricsJson || "{}");
      } catch {}
      try {
        deliveriesList = JSON.parse(r.snapshots[0].deliveriesJson || "[]");
      } catch {}
    }

    const repBacklinks = deliveriesList.filter((d) => d.type === "BACKLINK").length;
    const repContent = deliveriesList.filter((d) => d.type === "CONTENT").length;

    return {
      id: r.id,
      name: r.name,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      shareToken: r.shareToken,
      isArchived: r.isArchived,
      createdAt: r.createdAt,
      sessions: metrics.sessions || 0,
      sessionsChange: metrics.sessionsChange || 0,
      organicTraffic: metrics.organicTraffic || 0,
      organicTrafficChange: metrics.organicTrafficChange || 0,
      conversions: metrics.conversions || 0,
      backlinksCount: repBacklinks,
      contentCount: repContent,
    };
  });

  const latestReport = reportsLedger[0] || null;

  return {
    client: {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      domain: client.properties[0]?.domain || "example.com",
      createdAt: client.createdAt,
    },
    kpis: {
      totalReports: reports.length,
      sinceDate: client.createdAt,
      latestSessions: latestReport?.sessions ?? 0,
      latestOrganic: latestReport?.organicTraffic ?? 0,
      latestMonth: latestReport ? new Date(latestReport.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—",
      backlinksPlaced: backlinksCount,
      contentPublished: contentCount,
    },
    reports: reportsLedger,
  };
};

// 12. Save full report details (from edit view)
export const saveReportDetails = async (
  reportId: string,
  data: {
    startDate?: Date;
    endDate?: Date;
    summary?: string;
    nextMonthPlans?: string;
    emailStatus?: string;
    emailSentAt?: Date;
    emailSentTo?: string;
  },
  actorEmail: string
) => {
  const existing = await db.report.findUnique({
    where: { id: reportId },
    include: { client: true },
  });
  if (!existing) throw new Error("Report not found.");

  const updated = await db.report.update({
    where: { id: reportId },
    data: {
      ...(data.startDate ? { startDate: data.startDate } : {}),
      ...(data.endDate ? { endDate: data.endDate } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.nextMonthPlans !== undefined ? { nextMonthPlans: data.nextMonthPlans } : {}),
      ...(data.emailStatus ? { emailStatus: data.emailStatus } : {}),
      ...(data.emailSentAt ? { emailSentAt: data.emailSentAt } : {}),
      ...(data.emailSentTo ? { emailSentTo: data.emailSentTo } : {}),
    },
  });

  return updated;
};

