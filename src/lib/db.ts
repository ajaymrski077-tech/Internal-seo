import { createModel } from "./mongoDbAdapter";

export const userCol = createModel("users");
export const websitePropertyCol = createModel("websiteProperties", attachPropertyRelations);
export const integrationConnectionCol = createModel("integrationConnections");
export const analyticsSnapshotCol = createModel("analyticsSnapshots");
export const deliveryEventCol = createModel("deliveryEvents");
export const contentDeliveryCol = createModel("contentDeliveries");
export const linkDeliveryCol = createModel("linkDeliveries");
export const activityLogCol = createModel("activityLogs");
export const reportSnapshotCol = createModel("reportSnapshots");
export const ticketCol = createModel("tickets", async (item, include) => {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  return item;
});
export const taskCol = createModel("tasks", async (item, include) => {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.prCampaign && item.prCampaignId) item.prCampaign = await prCampaignCol.findUnique({ where: { id: item.prCampaignId } });
  if (include?.linkCampaign && item.linkCampaignId) item.linkCampaign = await linkCampaignCol.findUnique({ where: { id: item.linkCampaignId } });
  return item;
});
export const prPublicationCol = createModel("prPublications");
export const prContactCol = createModel("prContacts");
export const prOutreachRecordCol = createModel("prOutreachRecords");
export const prPlacementCol = createModel("prPlacements");
export const prCampaignCol = createModel("prCampaigns", async (item, include) => {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.outreachRecords) item.outreachRecords = await prOutreachRecordCol.findMany({ where: { campaignId: item.id } });
  if (include?.placements) item.placements = await prPlacementCol.findMany({ where: { campaignId: item.id } });
  if (include?.tasks) item.tasks = await taskCol.findMany({ where: { prCampaignId: item.id } });
  return item;
});
export const linkOpportunityCol = createModel("linkOpportunities");
export const acquiredBacklinkCol = createModel("acquiredBacklinks");
export const linkCampaignCol = createModel("linkCampaigns", async (item, include) => {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.opportunities) item.opportunities = await linkOpportunityCol.findMany({ where: { campaignId: item.id } });
  if (include?.acquiredLinks) item.acquiredLinks = await acquiredBacklinkCol.findMany({ where: { campaignId: item.id } });
  if (include?.tasks) item.tasks = await taskCol.findMany({ where: { linkCampaignId: item.id } });
  return item;
});
export const keywordRankingSnapshotCol = createModel("keywordRankingSnapshots");
export const trackedKeywordCol = createModel("trackedKeywords", async (item, include) => {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  if (include?.snapshots) item.snapshots = await keywordRankingSnapshotCol.findMany({ where: { trackedKeywordId: item.id }, orderBy: include.snapshots?.orderBy });
  return item;
});
export const seoPageCol = createModel("seoPages");
export const seoIssueCol = createModel("seoIssues");
export const seoAuditCol = createModel("seoAudits", async (item, include) => {
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  if (include?.pages) item.pages = await seoPageCol.findMany({ where: { auditId: item.id } });
  if (include?.issues) item.issues = await seoIssueCol.findMany({ where: { auditId: item.id } });
  return item;
});
export const gbpPerformanceSnapshotCol = createModel("gbpPerformanceSnapshots");
export const gbpLocationCol = createModel("gbpLocations", async (item, include) => {
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  if (include?.snapshots) item.snapshots = await gbpPerformanceSnapshotCol.findMany({ where: { locationId: item.id } });
  return item;
});
export const contentBriefCol = createModel("contentBriefs");
export const contentDraftCol = createModel("contentDrafts");
export const contentItemCol = createModel("contentItems", async (item, include) => {
  if (include?.brief) item.brief = await contentBriefCol.findFirst({ where: { contentItemId: item.id } });
  if (include?.draft) item.draft = await contentDraftCol.findFirst({ where: { contentItemId: item.id } });
  return item;
});
export const reportCol = createModel("reports", async (item, include) => {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.snapshots) item.snapshots = await reportSnapshotCol.findMany({ where: { reportId: item.id } });
  return item;
});
export const clientCol = createModel("clients", attachClientRelations);

// Relational-aware extensions
async function attachClientRelations(client: any, include: any) {
  if (!client || !include) return client;
  if (include.properties) {
    client.properties = await websitePropertyCol.findMany({ where: { clientId: client.id } });
  }
  if (include.deliveryEvents) {
    client.deliveryEvents = await deliveryEventCol.findMany({ where: { clientId: client.id } });
  }
  if (include.reports) {
    client.reports = await reportCol.findMany({ where: { clientId: client.id } });
  }
  if (include.tickets) {
    client.tickets = await ticketCol.findMany({ where: { clientId: client.id } });
  }
  if (include.tasks) {
    client.tasks = await taskCol.findMany({ where: { clientId: client.id } });
  }
  if (include.prCampaigns) {
    client.prCampaigns = await prCampaignCol.findMany({ where: { clientId: client.id } });
  }
  if (include.linkCampaigns) {
    client.linkCampaigns = await linkCampaignCol.findMany({ where: { clientId: client.id } });
  }
  if (include.trackedKeywords) {
    client.trackedKeywords = await trackedKeywordCol.findMany({ where: { clientId: client.id } });
  }
  return client;
}

async function attachPropertyRelations(prop: any, include: any) {
  if (!prop || !include) return prop;
  if (include.client && prop.clientId) {
    prop.client = await clientCol.findUnique({ where: { id: prop.clientId } });
  }
  if (include.connections) {
    prop.connections = await integrationConnectionCol.findMany({ where: { propertyId: prop.id } });
  }
  if (include.snapshots) {
    prop.snapshots = await analyticsSnapshotCol.findMany({
      where: { propertyId: prop.id, ...(include.snapshots?.where || {}) },
      orderBy: include.snapshots?.orderBy,
      take: include.snapshots?.take,
    });
  }
  if (include.trackedKeywords) {
    prop.trackedKeywords = await trackedKeywordCol.findMany({ where: { propertyId: prop.id } });
  }
  if (include.seoAudits) {
    prop.seoAudits = await seoAuditCol.findMany({ where: { propertyId: prop.id } });
  }
  if (include.gbpLocation) {
    prop.gbpLocation = await gbpLocationCol.findFirst({ where: { propertyId: prop.id } });
  }
  if (include.contentItems) {
    prop.contentItems = await contentItemCol.findMany({ where: { propertyId: prop.id } });
  }
  return prop;
}

const prisma = {
  user: userCol,
  client: clientCol,
  websiteProperty: websitePropertyCol,
  integrationConnection: integrationConnectionCol,
  analyticsSnapshot: analyticsSnapshotCol,
  deliveryEvent: deliveryEventCol,
  contentDelivery: contentDeliveryCol,
  linkDelivery: linkDeliveryCol,
  activityLog: activityLogCol,
  report: reportCol,
  reportSnapshot: reportSnapshotCol,
  ticket: ticketCol,
  task: taskCol,
  prCampaign: prCampaignCol,
  prPublication: prPublicationCol,
  prContact: prContactCol,
  prOutreachRecord: prOutreachRecordCol,
  prPlacement: prPlacementCol,
  linkCampaign: linkCampaignCol,
  linkBuildingCampaign: linkCampaignCol,
  linkOpportunity: linkOpportunityCol,
  acquiredBacklink: acquiredBacklinkCol,
  trackedKeyword: trackedKeywordCol,
  keywordRankingSnapshot: keywordRankingSnapshotCol,
  seoAudit: seoAuditCol,
  seoPage: seoPageCol,
  seoIssue: seoIssueCol,
  gbpLocation: gbpLocationCol,
  gbpPerformanceSnapshot: gbpPerformanceSnapshotCol,
  contentItem: contentItemCol,
  contentBrief: contentBriefCol,
  contentDraft: contentDraftCol,

  $transaction: async (fn: (tx: any) => Promise<any>) => {
    return fn(prisma);
  },

  $disconnect: async () => {
    // Connection pool handles disconnect automatically
  },
};

export default prisma;
