import { createModel } from "./mongoDbAdapter";
import {
  User,
  Client,
  WebsiteProperty,
  IntegrationConnection,
  AnalyticsSnapshot,
  DeliveryEvent,
  ContentDelivery,
  LinkDelivery,
  ActivityLog,
  Report,
  ReportSnapshot,
  Ticket,
  Task,
  PrCampaign,
  PrPublication,
  PrContact,
  PrOutreachRecord,
  PrPlacement,
  LinkCampaign,
  LinkOpportunity,
  AcquiredBacklink,
  TrackedKeyword,
  KeywordRankingSnapshot,
  SeoAudit,
  SeoPage,
  SeoIssue,
  GbpLocation,
  GbpPerformanceSnapshot,
  ContentItem,
  ContentBrief,
  ContentDraft,
} from "@prisma/client";

// Define composite types with relations
export type UserWithRelations = User;

export type ClientWithRelations = Client & {
  properties?: WebsitePropertyWithRelations[];
  deliveryEvents?: DeliveryEventWithRelations[];
  reports?: ReportWithRelations[];
  tickets?: TicketWithRelations[];
  tasks?: TaskWithRelations[];
  prCampaigns?: PrCampaignWithRelations[];
  linkCampaigns?: LinkCampaignWithRelations[];
  trackedKeywords?: TrackedKeywordWithRelations[];
};

export type WebsitePropertyWithRelations = WebsiteProperty & {
  client?: ClientWithRelations | null;
  connections?: IntegrationConnection[];
  snapshots?: AnalyticsSnapshot[];
  trackedKeywords?: TrackedKeywordWithRelations[];
  seoAudits?: SeoAuditWithRelations[];
  gbpLocation?: GbpLocationWithRelations | null;
  contentItems?: ContentItemWithRelations[];
};

export type DeliveryEventWithRelations = DeliveryEvent & {
  contentDetails?: ContentDelivery | null;
  linkDetails?: LinkDelivery | null;
  client?: ClientWithRelations | null;
  property?: WebsitePropertyWithRelations | null;
};

export type TicketWithRelations = Ticket & {
  client?: ClientWithRelations | null;
};

export type TaskWithRelations = Task & {
  client?: ClientWithRelations | null;
  prCampaign?: PrCampaignWithRelations | null;
  linkCampaign?: LinkCampaignWithRelations | null;
};

export type PrCampaignWithRelations = PrCampaign & {
  client?: ClientWithRelations | null;
  outreachRecords?: PrOutreachRecord[];
  placements?: PrPlacement[];
  tasks?: TaskWithRelations[];
  _count?: {
    outreachRecords: number;
    placements: number;
    tasks: number;
  };
};

export type LinkCampaignWithRelations = LinkCampaign & {
  client?: ClientWithRelations | null;
  opportunities?: LinkOpportunity[];
  acquiredLinks?: AcquiredBacklink[];
  tasks?: TaskWithRelations[];
  _count?: {
    opportunities: number;
    acquiredLinks: number;
    tasks: number;
  };
};

export type TrackedKeywordWithRelations = TrackedKeyword & {
  client?: ClientWithRelations | null;
  property?: WebsitePropertyWithRelations | null;
  snapshots?: KeywordRankingSnapshot[];
};

export type SeoAuditWithRelations = SeoAudit & {
  property?: WebsitePropertyWithRelations | null;
  pages?: SeoPage[];
  issues?: SeoIssue[];
};

export type GbpLocationWithRelations = GbpLocation & {
  property?: WebsitePropertyWithRelations | null;
  snapshots?: GbpPerformanceSnapshot[];
};

export type ContentItemWithRelations = ContentItem & {
  brief?: ContentBrief | null;
  draft?: ContentDraft | null;
};

export type ReportWithRelations = Report & {
  client?: ClientWithRelations | null;
  snapshots?: ReportSnapshot[];
};

// Create Models with exact generic type parameters
export const userCol = createModel<User>("users");
export const clientCol = createModel<ClientWithRelations>("clients", attachClientRelations);
export const websitePropertyCol = createModel<WebsitePropertyWithRelations>("websiteProperties", attachPropertyRelations);
export const integrationConnectionCol = createModel<IntegrationConnection>("integrationConnections");
export const analyticsSnapshotCol = createModel<AnalyticsSnapshot>("analyticsSnapshots");
export const deliveryEventCol = createModel<DeliveryEventWithRelations>("deliveryEvents", attachDeliveryEventRelations);
export const contentDeliveryCol = createModel<ContentDelivery>("contentDeliveries");
export const linkDeliveryCol = createModel<LinkDelivery>("linkDeliveries");
export const activityLogCol = createModel<ActivityLog>("activityLogs");
export const reportSnapshotCol = createModel<ReportSnapshot>("reportSnapshots");
export const ticketCol = createModel<TicketWithRelations>("tickets", attachTicketRelations);
export const taskCol = createModel<TaskWithRelations>("tasks", attachTaskRelations);
export const prPublicationCol = createModel<PrPublication>("prPublications");
export const prContactCol = createModel<PrContact>("prContacts");
export const prOutreachRecordCol = createModel<PrOutreachRecord>("prOutreachRecords");
export const prPlacementCol = createModel<PrPlacement>("prPlacements");
export const prCampaignCol = createModel<PrCampaignWithRelations>("prCampaigns", attachPrCampaignRelations);
export const linkOpportunityCol = createModel<LinkOpportunity>("linkOpportunities");
export const acquiredBacklinkCol = createModel<AcquiredBacklink>("acquiredBacklinks");
export const linkCampaignCol = createModel<LinkCampaignWithRelations>("linkCampaigns", attachLinkCampaignRelations);
export const keywordRankingSnapshotCol = createModel<KeywordRankingSnapshot>("keywordRankingSnapshots");
export const trackedKeywordCol = createModel<TrackedKeywordWithRelations>("trackedKeywords", attachTrackedKeywordRelations);
export const seoPageCol = createModel<SeoPage>("seoPages");
export const seoIssueCol = createModel<SeoIssue>("seoIssues");
export const seoAuditCol = createModel<SeoAuditWithRelations>("seoAudits", attachSeoAuditRelations);
export const gbpPerformanceSnapshotCol = createModel<GbpPerformanceSnapshot>("gbpPerformanceSnapshots");
export const gbpLocationCol = createModel<GbpLocationWithRelations>("gbpLocations", attachGbpLocationRelations);
export const contentBriefCol = createModel<ContentBrief>("contentBriefs");
export const contentDraftCol = createModel<ContentDraft>("contentDrafts");
export const contentItemCol = createModel<ContentItemWithRelations>("contentItems", attachContentItemRelations);
export const reportCol = createModel<ReportWithRelations>("reports", attachReportRelations);

type IncludeConfig = Record<string, unknown>;

// Hoisted named relation resolver functions to avoid block scoping/hoisting issues
async function attachClientRelations(client: ClientWithRelations, include: IncludeConfig): Promise<ClientWithRelations> {
  if (!client || !include) return client;
  if (include.properties) {
    const propInclude = typeof include.properties === "object" && include.properties !== null
      ? (include.properties.include || include.properties)
      : { connections: true };
    client.properties = await websitePropertyCol.findMany({
      where: { clientId: client.id },
      include: propInclude
    });
  }
  if (include.deliveryEvents) {
    const deliveryInclude = typeof include.deliveryEvents === "object" && include.deliveryEvents !== null
      ? (include.deliveryEvents.include || include.deliveryEvents)
      : undefined;
    client.deliveryEvents = await deliveryEventCol.findMany({
      where: { clientId: client.id },
      include: deliveryInclude,
      orderBy: include.deliveryEvents?.orderBy
    });
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

async function attachPropertyRelations(prop: WebsitePropertyWithRelations, include: IncludeConfig): Promise<WebsitePropertyWithRelations> {
  if (!prop || !include) return prop;
  if (include.client && prop.clientId) {
    prop.client = await clientCol.findUnique({ where: { id: prop.clientId } });
  }
  if (include.connections) {
    prop.connections = await integrationConnectionCol.findMany({ where: { propertyId: prop.id } });
  }
  if (include.snapshots) {
    const snapshotInclude = include.snapshots || {};
    prop.snapshots = await analyticsSnapshotCol.findMany({
      where: { propertyId: prop.id, ...(snapshotInclude.where || {}) },
      orderBy: snapshotInclude.orderBy,
      take: snapshotInclude.take,
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

async function attachDeliveryEventRelations(item: DeliveryEventWithRelations, include: IncludeConfig): Promise<DeliveryEventWithRelations> {
  if (include?.contentDetails) item.contentDetails = await contentDeliveryCol.findFirst({ where: { deliveryEventId: item.id } });
  if (include?.linkDetails) item.linkDetails = await linkDeliveryCol.findFirst({ where: { deliveryEventId: item.id } });
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  return item;
}

async function attachTicketRelations(item: TicketWithRelations, include: IncludeConfig): Promise<TicketWithRelations> {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  return item;
}

async function attachTaskRelations(item: TaskWithRelations, include: IncludeConfig): Promise<TaskWithRelations> {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.prCampaign && item.prCampaignId) item.prCampaign = await prCampaignCol.findUnique({ where: { id: item.prCampaignId } });
  if (include?.linkCampaign && item.linkCampaignId) item.linkCampaign = await linkCampaignCol.findUnique({ where: { id: item.linkCampaignId } });
  return item;
}

async function attachPrCampaignRelations(item: PrCampaignWithRelations, include: IncludeConfig): Promise<PrCampaignWithRelations> {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.outreachRecords) item.outreachRecords = await prOutreachRecordCol.findMany({ where: { campaignId: item.id } });
  if (include?.placements) item.placements = await prPlacementCol.findMany({ where: { campaignId: item.id } });
  if (include?.tasks) item.tasks = await taskCol.findMany({ where: { prCampaignId: item.id } });
  if (include?._count) {
    item._count = {
      outreachRecords: await prOutreachRecordCol.count({ where: { campaignId: item.id } }),
      placements: await prPlacementCol.count({ where: { campaignId: item.id } }),
      tasks: await taskCol.count({ where: { prCampaignId: item.id } }),
    };
  }
  return item;
}

async function attachLinkCampaignRelations(item: LinkCampaignWithRelations, include: IncludeConfig): Promise<LinkCampaignWithRelations> {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.opportunities) item.opportunities = await linkOpportunityCol.findMany({ where: { campaignId: item.id } });
  if (include?.acquiredLinks) item.acquiredLinks = await acquiredBacklinkCol.findMany({ where: { campaignId: item.id } });
  if (include?.tasks) item.tasks = await taskCol.findMany({ where: { linkCampaignId: item.id } });
  if (include?._count) {
    item._count = {
      opportunities: await linkOpportunityCol.count({ where: { campaignId: item.id } }),
      acquiredLinks: await acquiredBacklinkCol.count({ where: { campaignId: item.id } }),
      tasks: await taskCol.count({ where: { linkCampaignId: item.id } }),
    };
  }
  return item;
}

async function attachTrackedKeywordRelations(item: TrackedKeywordWithRelations, include: IncludeConfig): Promise<TrackedKeywordWithRelations> {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  if (include?.snapshots) item.snapshots = await keywordRankingSnapshotCol.findMany({ where: { trackedKeywordId: item.id }, orderBy: include.snapshots?.orderBy });
  return item;
}

async function attachSeoAuditRelations(item: SeoAuditWithRelations, include: IncludeConfig): Promise<SeoAuditWithRelations> {
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  if (include?.pages) item.pages = await seoPageCol.findMany({ where: { auditId: item.id } });
  if (include?.issues) item.issues = await seoIssueCol.findMany({ where: { auditId: item.id } });
  return item;
}

async function attachGbpLocationRelations(item: GbpLocationWithRelations, include: IncludeConfig): Promise<GbpLocationWithRelations> {
  if (include?.property && item.propertyId) item.property = await websitePropertyCol.findUnique({ where: { id: item.propertyId } });
  if (include?.snapshots) item.snapshots = await gbpPerformanceSnapshotCol.findMany({ where: { locationId: item.id } });
  return item;
}

async function attachContentItemRelations(item: ContentItemWithRelations, include: IncludeConfig): Promise<ContentItemWithRelations> {
  if (include?.brief) item.brief = await contentBriefCol.findFirst({ where: { contentItemId: item.id } });
  if (include?.draft) item.draft = await contentDraftCol.findFirst({ where: { contentItemId: item.id } });
  return item;
}

async function attachReportRelations(item: ReportWithRelations, include: IncludeConfig): Promise<ReportWithRelations> {
  if (include?.client && item.clientId) item.client = await clientCol.findUnique({ where: { id: item.clientId } });
  if (include?.snapshots) item.snapshots = await reportSnapshotCol.findMany({ where: { reportId: item.id } });
  return item;
}

const basePrisma = {
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
};

export type DatabaseClient = typeof basePrisma & {
  $transaction: <R>(fn: (tx: typeof basePrisma) => Promise<R>) => Promise<R>;
  $disconnect: () => Promise<void>;
};

const prisma: DatabaseClient = {
  ...basePrisma,
  $transaction: async <R>(fn: (tx: typeof basePrisma) => Promise<R>): Promise<R> => {
    return fn(basePrisma);
  },
  $disconnect: async () => {
    // Connection pool handles disconnect automatically
  },
};

export default prisma;
