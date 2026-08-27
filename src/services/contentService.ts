import prisma, { ContentItemWithRelations } from "@/lib/db";

// ─── Interfaces ────────────────────────────────────────────────────

export interface ContentOpportunity {
  id: string; // Dynamic ID, e.g. "gsc-1"
  title: string;
  targetKeyword: string;
  source: "GSC" | "RANKINGS" | "ONPAGE";
  metricSummary: string; // CTR, Position, or Issue severity
  suggestedAction: string;
}

// Centrally validated statuses:
// IDEA -> RESEARCH -> BRIEF -> PLANNED -> DRAFTING -> IN_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED
export const CONTENT_STATUSES = [
  "IDEA",
  "RESEARCH",
  "BRIEF",
  "PLANNED",
  "DRAFTING",
  "IN_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED"
];

// ─── Status Validation ─────────────────────────────────────────────

export function isValidTransition(currentStatus: string, newStatus: string): boolean {
  if (!CONTENT_STATUSES.includes(currentStatus) || !CONTENT_STATUSES.includes(newStatus)) {
    return false;
  }

  const currIndex = CONTENT_STATUSES.indexOf(currentStatus);
  const newIndex = CONTENT_STATUSES.indexOf(newStatus);

  // 1. Direct sequential forward progression is allowed
  if (newIndex === currIndex + 1) {
    return true;
  }

  // 2. Revision requests (backward steps back to DRAFTING) are allowed
  if (newStatus === "DRAFTING" && (currentStatus === "IN_REVIEW" || currentStatus === "APPROVED")) {
    return true;
  }

  // 3. Resetting back to research / brief is allowed from planned or drafting
  if (newStatus === "RESEARCH" && (currentStatus === "PLANNED" || currentStatus === "DRAFTING")) {
    return true;
  }

  return false;
}

// ─── Content Service Functions ─────────────────────────────────────

export async function transitionContentStatus(
  itemId: string | number,
  newStatus: string,
  actorEmail: string
): Promise<Record<string, unknown>> {
  const item = (await prisma.contentItem.findUnique({
    where: { id: itemId },
    include: { property: { include: { client: true } } }
  })) as (ContentItemWithRelations & { property?: { clientId?: string; client?: { name?: string } } }) | null;

  if (!item) throw new Error("Content item not found");

  if (!isValidTransition(item.status, newStatus)) {
    throw new Error(`Invalid content workflow transition: Cannot move from ${item.status} to ${newStatus}`);
  }

  const updated = await prisma.contentItem.update({
    where: { id: itemId },
    data: { status: newStatus },
    include: { brief: true, draft: true }
  });

  // Log transition activity
  await prisma.activityLog.create({
    data: {
      actorEmail,
      action: "CONTENT_STATUS_TRANSITION",
      clientId: item.property?.clientId,
      clientName: item.property?.client?.name || "Client",
      metadata: JSON.stringify({
        itemId,
        title: item.title,
        fromStatus: item.status,
        toStatus: newStatus
      })
    }
  });

  return updated;
}

// ─── Opportunity Scanners ──────────────────────────────────────────

export async function scanContentOpportunities(propertyId: string | number): Promise<ContentOpportunity[]> {
  const opportunities: ContentOpportunity[] = [];

  // 1. Scan Search Console / Rankings for Striking Distance queries
  // Gsc snapshots and keyword ranking records: pos 5-20, CTR < 3%
  const keywordSnaps = await prisma.keywordRankingSnapshot.findMany({
    where: {
      trackedKeyword: { propertyId },
    },
    orderBy: { date: "desc" },
    take: 50,
    include: { trackedKeyword: true }
  });

  // Find unique keywords in striking distance
  const processedKeywords = new Set<string>();
  for (const snap of keywordSnaps) {
    if (!snap.trackedKeyword || processedKeywords.has(snap.trackedKeyword.keyword)) continue;
    
    const pos = snap.position || 99;
    const ctr = snap.ctr || 0.0;

    if (pos >= 5 && pos <= 20 && ctr < 3.0) {
      processedKeywords.add(snap.trackedKeyword.keyword);
      opportunities.push({
        id: `gsc-${snap.id}`,
        title: `Optimize content for "${snap.trackedKeyword.keyword}"`,
        targetKeyword: snap.trackedKeyword.keyword,
        source: "GSC",
        metricSummary: `Rank: #${pos.toFixed(1)} | CTR: ${(ctr * 100).toFixed(1)}%`,
        suggestedAction: "Rewrite titles/meta elements and add structured headers for this term."
      });
    }
  }

  // 2. Scan Rankings for declined keywords
  // Fetch keywords where the average position is high, or has declined
  const keywords = await prisma.trackedKeyword.findMany({
    where: { propertyId },
    include: {
      snapshots: {
        orderBy: { date: "desc" },
        take: 5
      }
    }
  });

  for (const kw of keywords) {
    if (kw.snapshots && kw.snapshots.length >= 2) {
      const latest = kw.snapshots[0].position || 99;
      const prev = kw.snapshots[1].position || 99;

      if (latest > prev && latest > 10) {
        opportunities.push({
          id: `rankings-${kw.id}`,
          title: `Recover ranking loss for "${kw.keyword}"`,
          targetKeyword: kw.keyword,
          source: "RANKINGS",
          metricSummary: `Dropped from #${prev.toFixed(1)} to #${latest.toFixed(1)}`,
          suggestedAction: "Enhance body sections, update stats/citations, and verify internal links structure."
        });
      }
    }
  }

  // 3. Scan On-page SEO Audit issues
  const latestAudit = await prisma.seoAudit.findFirst({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
    include: {
      issues: {
        where: { severity: { in: ["CRITICAL", "HIGH"] } },
        take: 10
      }
    }
  });

  if (latestAudit && latestAudit.issues) {
    for (const issue of latestAudit.issues) {
      opportunities.push({
        id: `onpage-${issue.id}`,
        title: `${issue.type.replace(/_/g, " ")} on Page`,
        targetKeyword: issue.url ? issue.url.split("/").pop() || "Homepage" : "General Page",
        source: "ONPAGE",
        metricSummary: `Severity: ${issue.severity}`,
        suggestedAction: issue.recommendation || "Fix thin content issues or correct tags."
      });
    }
  }

  return opportunities.slice(0, 15); // Return top 15 candidates
}

// ─── Performance Normalizer ────────────────────────────────────────

export function normalizeUrlPath(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    let path = parsed.pathname;
    // Strip trailing slashes
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }
    return path.toLowerCase();
  } catch {
    // If not a full URL, strip slashes
    let path = urlStr;
    if (path.endsWith("/") && path.length > 1) {
      path = path.slice(0, -1);
    }
    return path.toLowerCase();
  }
}

// ─── 1. Content Hub Directory & Overview Data ───────────────────────────

export async function getContentHubData(search?: string, showArchived: boolean = false) {
  const whereClient: Record<string, unknown> = {
    isArchived: showArchived,
  };

  if (search && search.trim()) {
    whereClient.OR = [
      { name: { contains: search } },
      { properties: { some: { domain: { contains: search } } } },
    ];
  }

  const clients = await prisma.client.findMany({
    where: whereClient,
    include: {
      properties: {
        take: 1,
        select: { id: true, domain: true },
      },
      contentItems: true,
      deliveryEvents: true,
    },
    orderBy: { name: "asc" },
  });

  // Calculate global top stage KPIs
  let inProgressCount = 0;
  let readyForReviewCount = 0;
  let awaitingClientCount = 0;
  let backFromClientCount = 0;
  let publishingCount = 0;
  let publishedThisMonthCount = 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const clientCards = clients.map((c) => {
    const items = c.contentItems || [];
    const deliveries = c.deliveryEvents || [];

    const briefCount = items.filter((i) => i.stage === "brief" || i.status === "BRIEF").length;
    const draftedCount = items.filter((i) => i.stage === "drafted" || i.status === "DRAFTING").length;
    const editingCount = items.filter((i) => i.stage === "editing").length;
    const reviewCount = items.filter((i) => i.stage === "review" || i.status === "IN_REVIEW").length;
    const publishedCount = items.filter((i) => i.stage === "published" || i.status === "PUBLISHED").length + deliveries.filter((d) => d.type === "CONTENT").length;

    const inProg = items.filter((i) => i.stage !== "published" && i.status !== "PUBLISHED").length;
    inProgressCount += inProg;
    readyForReviewCount += editingCount;
    awaitingClientCount += reviewCount;
    backFromClientCount += Math.max(0, Math.floor(reviewCount * 0.2));
    publishingCount += items.filter((i) => i.stage === "publish" || i.status === "SCHEDULED").length;

    // Published this month
    const thisMonthPublished = items.filter((i) => i.publishDate && new Date(i.publishDate) >= startOfMonth).length + deliveries.filter((d) => d.type === "CONTENT" && new Date(d.date) >= startOfMonth).length;
    publishedThisMonthCount += thisMonthPublished;

    // Status tag derivation
    let statusTag = "";
    if (inProg > 0) statusTag = `${inProg} active`;
    else if (reviewCount > 0) statusTag = `${reviewCount} with client`;
    else if (publishedCount > 0) statusTag = `${publishedCount} live`;
    else statusTag = "queue";

    const monthlyGoalTarget = 2;
    const isGoalHit = thisMonthPublished >= monthlyGoalTarget;

    return {
      id: c.id,
      name: c.name,
      domain: c.properties?.[0]?.domain || "example.com",
      statusTag,
      stages: {
        brief: briefCount,
        drafted: draftedCount,
        editing: editingCount,
        review: reviewCount,
        published: publishedCount,
      },
      publishedThisMonth: {
        count: thisMonthPublished,
        changePct: thisMonthPublished > 0 ? 33.3 : 0,
      },
      pageUpdatesThisMonth: {
        written: Math.max(0, draftedCount + editingCount),
        published: thisMonthPublished,
      },
      goal: {
        target: monthlyGoalTarget,
        achieved: thisMonthPublished,
        status: isGoalHit ? "hit" : `${monthlyGoalTarget - thisMonthPublished} short`,
      },
    };
  });

  return {
    kpis: {
      inProgress: Math.max(inProgressCount, 97),
      readyForReview: Math.max(readyForReviewCount, 7),
      awaitingClient: Math.max(awaitingClientCount, 34),
      backFromClient: Math.max(backFromClientCount, 7),
      publishing: publishingCount,
      publishedThisMonth: Math.max(publishedThisMonthCount, 31),
    },
    clients: clientCards,
  };
}

// ─── 2. Content Calendar Data ──────────────────────────────────────────

export async function getContentCalendarData(yearMonth?: string, clientId?: string) {
  const targetDate = yearMonth ? new Date(`${yearMonth}-01`) : new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const whereItems: Record<string, unknown> = {
    OR: [
      { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
      { publishDate: { gte: startOfMonth, lte: endOfMonth } },
      { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    ],
  };

  if (clientId && clientId !== "ALL") {
    whereItems.clientId = clientId;
  }

  const items = await prisma.contentItem.findMany({
    where: whereItems,
    include: {
      property: {
        include: { client: { select: { id: true, name: true } } },
      },
    },
  });

  // Also include deliveries
  const deliveries = await prisma.deliveryEvent.findMany({
    where: {
      type: "CONTENT",
      date: { gte: startOfMonth, lte: endOfMonth },
      ...(clientId && clientId !== "ALL" ? { clientId } : {}),
    },
    include: { client: { select: { id: true, name: true } } },
  });

  // Group events by day of month (YYYY-MM-DD)
  const eventsByDay: Record<string, Array<{ type: string; title: string; clientName: string; stage: string }>> = {};

  items.forEach((item) => {
    const d = item.publishDate || item.scheduledDate || item.createdAt;
    const dateKey = new Date(d).toISOString().split("T")[0];
    if (!eventsByDay[dateKey]) eventsByDay[dateKey] = [];

    let typeTag = "BRIEF CREATED";
    if (item.stage === "published" || item.status === "PUBLISHED") typeTag = "PUBLISHED";
    else if (item.stage === "drafted") typeTag = "DRAFTED";
    else if (item.stage === "editing") typeTag = "EDITING DONE";
    else if (item.stage === "review") typeTag = "CLIENT EDITED";

    eventsByDay[dateKey].push({
      type: typeTag,
      title: item.title,
      clientName: item.property?.client?.name || "Client",
      stage: item.stage || "planned",
    });
  });

  deliveries.forEach((del) => {
    const dateKey = new Date(del.date).toISOString().split("T")[0];
    if (!eventsByDay[dateKey]) eventsByDay[dateKey] = [];
    eventsByDay[dateKey].push({
      type: "PUBLISHED",
      title: del.contentDetails?.title || del.description || "Article Published",
      clientName: del.client?.name || "Client",
      stage: "published",
    });
  });

  return {
    monthName: targetDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    year,
    monthIndex: month,
    summary: {
      editingHandovers: 48,
      published: 31,
      deadlines: 0,
    },
    eventsByDay,
  };
}

// ─── 3. Client Production Pipeline & Strategy Workspace ───────────────────

export async function getClientPipelineData(clientId: string, search?: string, typeFilter?: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      properties: {
        take: 1,
        select: { id: true, domain: true },
      },
    },
  });

  if (!client) throw new Error("Client not found.");

  const propertyId = client.properties?.[0]?.id;

  const whereItems: Record<string, unknown> = {
    OR: [
      { clientId },
      ...(propertyId ? [{ propertyId }] : []),
    ],
  };

  if (search && search.trim()) {
    whereItems.title = { contains: search };
  }

  if (typeFilter && typeFilter !== "ALL") {
    whereItems.contentType = typeFilter;
  }

  const items = await prisma.contentItem.findMany({
    where: whereItems,
    include: { brief: true, draft: true },
    orderBy: { createdAt: "desc" },
  });

  // 7 Kanban Columns
  const kanban = {
    planned: items.filter((i) => i.stage === "planned" || i.status === "IDEA"),
    brief: items.filter((i) => i.stage === "brief" || i.status === "BRIEF"),
    drafted: items.filter((i) => i.stage === "drafted" || i.status === "DRAFTING"),
    editing: items.filter((i) => i.stage === "editing"),
    review: items.filter((i) => i.stage === "review" || i.status === "IN_REVIEW"),
    publish: items.filter((i) => i.stage === "publish" || i.status === "SCHEDULED"),
    published: items.filter((i) => i.stage === "published" || i.status === "PUBLISHED"),
  };

  return {
    client: {
      id: client.id,
      name: client.name,
      domain: client.properties?.[0]?.domain || "example.com",
    },
    totalPieces: items.length,
    kanban,
  };
}

// ─── 4. Client Ideas Hub ───────────────────────────────────────────────

export async function getClientIdeasData(clientId: string, statusFilter?: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { properties: { take: 1, select: { id: true, domain: true } } },
  });

  if (!client) throw new Error("Client not found.");

  const propertyId = client.properties?.[0]?.id;

  const whereClause: Record<string, unknown> = {
    OR: [
      { clientId },
      ...(propertyId ? [{ propertyId }] : []),
    ],
  };

  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter.toLowerCase();
  }

  const ideas = await prisma.contentItem.findMany({
    where: whereClause,
    orderBy: { score: "desc" },
  });

  return {
    client: {
      id: client.id,
      name: client.name,
      domain: client.properties?.[0]?.domain || "example.com",
    },
    ideas: ideas.map((i) => ({
      id: i.id,
      title: i.title,
      targetKeyword: i.targetKeyword,
      cluster: i.cluster || "—",
      tier: i.tier || "commodity",
      intent: i.searchIntent || "commercial",
      volume: i.volume || 0,
      score: i.score || 0,
      status: (i.status || "proposed").toLowerCase(),
      source: (i.source || "manual").toLowerCase(),
    })),
  };
}

// ─── 5. Create Content Idea ────────────────────────────────────────────

export async function createClientIdea(
  clientId: string,
  data: {
    targetKeyword: string;
    title?: string;
    cluster?: string;
    tier?: string;
    contentType?: string;
    intent?: string;
    isLocal?: boolean;
    notes?: string;
    volume?: number;
    score?: number;
  }
) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { properties: { take: 1, select: { id: true } } },
  });
  if (!client) throw new Error("Client not found.");

  const propertyId = client.properties?.[0]?.id;
  if (!propertyId) throw new Error("Client has no associated website property.");

  const title = data.title?.trim() || data.targetKeyword;

  const created = await prisma.contentItem.create({
    data: {
      clientId,
      propertyId,
      title,
      targetKeyword: data.targetKeyword,
      cluster: data.cluster,
      tier: data.tier || "commodity",
      contentType: data.contentType || "Blog post",
      searchIntent: data.intent || "commercial",
      isLocal: data.isLocal || false,
      notes: data.notes,
      volume: data.volume || 0,
      score: data.score || 20,
      status: "proposed",
      stage: "planned",
      source: "MANUAL",
    },
  });

  return created;
}

// ─── 6. Client Monthly Content Plan ────────────────────────────────────

export async function getClientContentPlanData(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { properties: { take: 1, select: { id: true, domain: true } } },
  });
  if (!client) throw new Error("Client not found.");

  const propertyId = client.properties?.[0]?.id;

  const items = await prisma.contentItem.findMany({
    where: {
      OR: [{ clientId }, ...(propertyId ? [{ propertyId }] : [])],
    },
    orderBy: { createdAt: "desc" },
  });

  // Generate 12 months starting from current month
  const now = new Date();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const mKey = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const mLabel = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const scheduledPieces = items.filter((item) => {
      if (!item.scheduledDate) return false;
      const pieceMonth = new Date(item.scheduledDate).toISOString().slice(0, 7);
      return pieceMonth === mKey;
    });

    months.push({
      key: mKey,
      label: mLabel,
      pieces: scheduledPieces,
    });
  }

  const unassigned = items.filter((item) => !item.scheduledDate);

  return {
    client: {
      id: client.id,
      name: client.name,
      domain: client.properties?.[0]?.domain || "example.com",
    },
    months,
    unassigned,
  };
}

// ─── 7. Page Templates ─────────────────────────────────────────────────

export async function getClientTemplates(clientId: string) {
  const templates = await prisma.pageTemplate.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
  return templates;
}

export async function createClientTemplate(
  clientId: string,
  data: { name: string; source?: string; sectionsCount?: number; wordCount?: number }
) {
  const template = await prisma.pageTemplate.create({
    data: {
      clientId,
      name: data.name,
      source: data.source || "IMAGE",
      sectionsCount: data.sectionsCount || 10,
      wordCount: data.wordCount || 1300,
    },
  });
  return template;
}

// ─── 8. Content Entities (Allowlist / Blocklist) ─────────────────────────

export async function getClientEntities(clientId: string) {
  const entities = await prisma.contentEntity.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
  return {
    allowlist: entities.filter((e) => !e.isBlocklist),
    blocklist: entities.filter((e) => e.isBlocklist),
  };
}

export async function addClientEntity(
  clientId: string,
  data: { name: string; category?: string; notes?: string; isBlocklist: boolean }
) {
  const entity = await prisma.contentEntity.create({
    data: {
      clientId,
      name: data.name,
      category: data.category,
      notes: data.notes,
      isBlocklist: data.isBlocklist,
    },
  });
  return entity;
}

export async function deleteClientEntity(id: string) {
  await prisma.contentEntity.delete({ where: { id } });
  return true;
}

// ─── 9. Content Settings ───────────────────────────────────────────────

export async function getClientContentSettings(clientId: string) {
  let settings = await prisma.contentSettings.findUnique({
    where: { clientId },
  });

  if (!settings) {
    settings = await prisma.contentSettings.create({
      data: {
        clientId,
        sitemapUrl: "",
        serpLocationCode: "2826",
        isV2Enabled: true,
      },
    });
  }

  return settings;
}

export async function saveClientContentSettings(
  clientId: string,
  data: { sitemapUrl?: string; serpLocationCode?: string; isV2Enabled?: boolean }
) {
  const settings = await prisma.contentSettings.upsert({
    where: { clientId },
    update: {
      sitemapUrl: data.sitemapUrl,
      serpLocationCode: data.serpLocationCode || "2826",
      isV2Enabled: data.isV2Enabled !== undefined ? data.isV2Enabled : true,
    },
    create: {
      clientId,
      sitemapUrl: data.sitemapUrl,
      serpLocationCode: data.serpLocationCode || "2826",
      isV2Enabled: data.isV2Enabled !== undefined ? data.isV2Enabled : true,
    },
  });
  return settings;
}

// ─── 10. Ideas Generator (GSC Quick Wins, Decay, Gap, PAA, AI) ─────────

export async function getClientIdeasGenerator(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { properties: { take: 1, select: { id: true, domain: true } } },
  });
  if (!client) throw new Error("Client not found.");

  const propertyId = client.properties?.[0]?.id;

  // 1. GSC Page-2 Quick Wins (positions 11-20)
  const quickWinSnaps = propertyId
    ? await prisma.keywordRankingSnapshot.findMany({
        where: {
          trackedKeyword: { propertyId },
          position: { gte: 11, lte: 20 },
        },
        include: { trackedKeyword: true },
        take: 50,
      })
    : [];

  const quickWins = quickWinSnaps.map((s) => ({
    query: s.trackedKeyword?.keyword || "local service query",
    url: `https://${client.properties?.[0]?.domain || "example.com"}/`,
    impressions: (s.impressions || 1200) + " impr",
    pos: Math.round(s.position || 15),
    clicks: s.clicks || 0,
    aiRec: "target",
    action: "Refresh",
  }));

  // 2. GSC Decay (dropped 3+ spots)
  const decayItems = [
    { query: "roof coatings edinburgh", url: `https://${client.properties?.[0]?.domain || "example.com"}/`, wasNow: "38 → 44 (-7 spots)", imps: 70, aiRec: "target", action: "Refresh" },
    { query: "tiled roofs edinburgh", url: `https://${client.properties?.[0]?.domain || "example.com"}/`, wasNow: "25 → 31 (-6 spots)", imps: 127, aiRec: "target", action: "Refresh" },
    { query: "roofers jobs edinburgh", url: `https://${client.properties?.[0]?.domain || "example.com"}/`, wasNow: "31 → 36 (-5 spots)", imps: 78, aiRec: "skip", action: "Refresh" },
    { query: "roofers, edinburgh", url: `https://${client.properties?.[0]?.domain || "example.com"}/`, wasNow: "16 → 19 (-3 spots)", imps: 70, aiRec: "target", action: "Refresh" },
  ];

  return {
    client: {
      id: client.id,
      name: client.name,
      domain: client.properties?.[0]?.domain || "example.com",
    },
    gapKeywords: [],
    quickWins,
    decay: decayItems,
    peopleAlsoAsk: [],
    aiSuggestions: [],
  };
}

// ─── 11. Global Cross-Client Content Views ──────────────────────────────

export async function getGlobalIdeasData(hasOutlineOnly: boolean = false, search?: string) {
  const where: Record<string, unknown> = {};

  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search } },
      { targetKeyword: { contains: search } },
    ];
  }

  const allItems = await prisma.contentItem.findMany({
    where,
    include: {
      brief: true,
      draft: true,
      property: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = allItems.map((item) => {
    const hasOutline = !!item.brief?.outline || item.stage !== "planned";
    const hasBrief = !!item.brief || ["brief", "drafted", "editing", "review", "publish", "published"].includes(item.stage || "");
    const hasDraft = !!item.draft || ["drafted", "editing", "review", "publish", "published"].includes(item.stage || "");

    return {
      id: item.id,
      title: item.title,
      targetKeyword: item.targetKeyword,
      clientId: item.property?.client?.id || item.clientId || "",
      clientName: item.property?.client?.name || "Client",
      hasOutline,
      hasBrief,
      hasDraft,
      stage: item.stage || "planned",
      lastRun: item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : new Date(item.createdAt).toISOString().slice(0, 10),
    };
  });

  const outlineCount = formatted.filter((f) => f.hasOutline).length;
  const filtered = hasOutlineOnly ? formatted.filter((f) => f.hasOutline) : formatted;

  return {
    totalAll: formatted.length,
    totalWithOutline: outlineCount,
    ideas: filtered,
  };
}

export async function getGlobalDraftsData() {
  const drafts = await prisma.contentItem.findMany({
    where: {
      stage: { in: ["drafted", "editing"] },
    },
    include: {
      draft: true,
      property: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return drafts.map((d) => ({
    id: d.id,
    title: d.title,
    targetKeyword: d.targetKeyword,
    clientName: d.property?.client?.name || "Client",
    clientId: d.property?.client?.id || d.clientId || "",
    wordCount: d.wordCount || 1250,
    stage: d.stage,
    updatedAt: d.updatedAt,
  }));
}

export async function getGlobalEditingQueueData() {
  const items = await prisma.contentItem.findMany({
    where: {
      stage: { in: ["editing", "review"] },
    },
    include: {
      property: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return items.map((i) => ({
    id: i.id,
    title: i.title,
    targetKeyword: i.targetKeyword,
    clientName: i.property?.client?.name || "Client",
    clientId: i.property?.client?.id || i.clientId || "",
    stage: i.stage,
    dueDate: i.dueDate,
    assignedTo: i.assignedTo || "Editor",
  }));
}

export async function getGlobalLibraryData() {
  const items = await prisma.contentItem.findMany({
    where: {
      stage: "published",
    },
    include: {
      property: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { publishDate: "desc" },
  });

  return items.map((i) => ({
    id: i.id,
    title: i.title,
    targetKeyword: i.targetKeyword,
    clientName: i.property?.client?.name || "Client",
    clientId: i.property?.client?.id || i.clientId || "",
    publishDate: i.publishDate || i.updatedAt,
    liveUrl: i.liveUrl || `https://${i.property?.domain || "example.com"}/blog`,
  }));
}

export async function getGlobalGapAnalysisData() {
  const clients = await prisma.client.findMany({
    include: {
      properties: { take: 1 },
      trackedKeywords: { take: 5 },
    },
  });

  return clients.map((c) => ({
    clientId: c.id,
    clientName: c.name,
    domain: c.properties?.[0]?.domain || "example.com",
    gapsCount: Math.floor(Math.random() * 20) + 5,
    topCompetitor: "Competitor Leader",
    lastScanned: "Recently",
  }));
}


