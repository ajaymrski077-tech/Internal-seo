import prisma from "@/lib/db";

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
  const item = await prisma.contentItem.findUnique({
    where: { id: itemId },
    include: { property: { select: { clientId: true, client: { select: { name: true } } } } }
  });

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
    if (processedKeywords.has(snap.trackedKeyword.keyword)) continue;
    
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
    if (kw.snapshots.length >= 2) {
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
