import prisma from "@/lib/db";

export const getPrOverview = async (clientId?: string | number) => {
  const today = new Date();

  let campaignIds: string[] = [];
  if (clientId) {
    const campaigns = await prisma.prCampaign.findMany({
      where: { clientId: clientId.toString() },
      select: { id: true }
    });
    campaignIds = campaigns.map((c) => c.id);
  }

  const campaignWhere = clientId ? { clientId: clientId.toString() } : {};
  const relationWhere = clientId ? { campaignId: { in: campaignIds } } : {};

  if (clientId && campaignIds.length === 0) {
    return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      completedCampaigns: 0,
      totalOutreach: 0,
      contactedCount: 0,
      responsesCount: 0,
      interestedCount: 0,
      publishedPlacements: 0,
      responseRate: 0,
      placementRate: 0,
      upcomingFollowUps: 0,
      overdueFollowUps: 0,
    };
  }

  const [
    totalCampaigns,
    activeCampaigns,
    completedCampaigns,
    totalOutreach,
    contactedCount,
    responsesCount,
    interestedCount,
    publishedPlacements,
    upcomingFollowUps,
    overdueFollowUps,
  ] = await Promise.all([
    // Total Campaigns
    prisma.prCampaign.count({ where: campaignWhere }),
    // Active Campaigns
    prisma.prCampaign.count({ where: { ...campaignWhere, status: "ACTIVE" } }),
    // Completed Campaigns
    prisma.prCampaign.count({ where: { ...campaignWhere, status: "COMPLETED" } }),
    // Total Outreach Targets
    prisma.prOutreachRecord.count({ where: relationWhere }),
    // Contacted Count (contacted/sent out)
    prisma.prOutreachRecord.count({
      where: {
        ...relationWhere,
        outreachStatus: { not: "NOT_CONTACTED" },
      },
    }),
    // Responses Count
    prisma.prOutreachRecord.count({
      where: {
        ...relationWhere,
        outreachStatus: { in: ["RESPONDED", "INTERESTED", "PUBLISHED", "REJECTED"] },
      },
    }),
    // Interested Count
    prisma.prOutreachRecord.count({
      where: {
        ...relationWhere,
        outreachStatus: { in: ["INTERESTED", "PUBLISHED"] },
      },
    }),
    // Published Placements Count
    prisma.prPlacement.count({ where: relationWhere }),
    // Upcoming/Due Today Followups
    prisma.prOutreachRecord.count({
      where: {
        ...relationWhere,
        followUpDate: { gte: today },
        outreachStatus: { notIn: ["PUBLISHED", "REJECTED", "LOST"] },
      },
    }),
    // Overdue Followups
    prisma.prOutreachRecord.count({
      where: {
        ...relationWhere,
        followUpDate: { lt: today },
        outreachStatus: { notIn: ["PUBLISHED", "REJECTED", "LOST"] },
      },
    }),
  ]);

  const responseRate = contactedCount > 0 ? (responsesCount / contactedCount) * 100 : 0;
  const placementRate = contactedCount > 0 ? (publishedPlacements / contactedCount) * 100 : 0;

  return {
    totalCampaigns,
    activeCampaigns,
    completedCampaigns,
    totalOutreach,
    contactedCount,
    responsesCount,
    interestedCount,
    publishedPlacements,
    responseRate,
    placementRate,
    upcomingFollowUps,
    overdueFollowUps,
  };
};

export const getCampaigns = async (filters: {
  search?: string;
  clientId?: string | number;
  status?: string;
  priority?: string;
}) => {
  const where: Record<string, unknown> = {};

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }
  if (filters.status && filters.status !== "All") {
    where.status = filters.status.toUpperCase();
  }
  if (filters.priority && filters.priority !== "All") {
    where.priority = filters.priority.toUpperCase();
  }
  if (filters.search) {
    where.OR = [
      { campaignName: { contains: filters.search } },
      { description: { contains: filters.search } },
      { objective: { contains: filters.search } },
    ];
  }

  return prisma.prCampaign.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      _count: {
        select: {
          outreachRecords: true,
          placements: true,
          tasks: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
};

export const getCampaignDetail = async (campaignId: string | number) => {
  const campaign = await prisma.prCampaign.findUnique({
    where: { id: campaignId },
    include: {
      client: { select: { id: true, name: true } },
      outreachRecords: {
        include: {
          publication: true,
          contact: true,
        },
        orderBy: { updatedAt: "desc" },
      },
      placements: {
        orderBy: { publishedDate: "desc" },
      },
      tasks: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!campaign) return null;

  const activityLogs = await prisma.activityLog.findMany({
    where: {
      clientId: campaign.clientId,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    ...campaign,
    activityLogs,
  };
};

// Activity logging helper
export const logPrActivity = async (
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
    console.error("Failed to log PR activity:", err);
  }
};
