/**
 * SEO Audit Service
 *
 * Orchestration layer that ties crawlerService + seoAnalyzerService together.
 * Manages audit lifecycle: create → queue → run → complete/fail/cancel.
 * Runs crawls in-memory as background async tasks (no Redis/external queue needed).
 */

import prisma from "@/lib/db";
import {
  crawlSite,
  CrawlConfig,
  DEFAULT_CRAWL_CONFIG,
  CrawledPage,
  normalizeUrl,
  extractLinks,
} from "./crawlerService";
import {
  analyzeHtml,
  detectIssues,
  calculatePageScore,
  calculateSiteScore,
  SeoIssueRecord,
} from "./seoAnalyzerService";

// ─── Types ──────────────────────────────────────────────────────────

export interface AuditConfig {
  maxPages?: number;
  maxDepth?: number;
  concurrency?: number;
  respectRobots?: boolean;
  excludePatterns?: string[];
}

export interface AuditSummary {
  id: string | number;
  propertyId: string | number;
  status: string;
  score: number | null;
  pagesDiscovered: number;
  pagesCrawled: number;
  issuesCritical: number;
  issuesHigh: number;
  issuesMedium: number;
  issuesLow: number;
  issuesInfo: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  domain: string;
  clientName: string;
  errorMessage: string | null;
}

// Track running audits for cancellation
const runningAudits = new Map<string | number, { cancelled: boolean }>();

// ─── Clamp config to safe limits ────────────────────────────────────

function clampConfig(userConfig: AuditConfig): CrawlConfig {
  return {
    ...DEFAULT_CRAWL_CONFIG,
    maxPages: Math.min(Math.max(userConfig.maxPages || 100, 1), 500),
    maxDepth: Math.min(Math.max(userConfig.maxDepth || 5, 1), 10),
    concurrency: Math.min(Math.max(userConfig.concurrency || 3, 1), 5),
    respectRobots: userConfig.respectRobots !== false,
    excludePatterns: userConfig.excludePatterns || [],
  };
}

// ─── Create Audit ──────────────────────────────────────────────────

export async function createAudit(
  propertyId: string | number,
  userConfig: AuditConfig = {}
): Promise<string | number> {
  const config = clampConfig(userConfig);

  const audit = await prisma.seoAudit.create({
    data: {
      propertyId,
      status: "QUEUED",
      configuration: JSON.stringify(config),
    },
  });

  // Fire and forget — do NOT await
  runAuditInBackground(audit.id, propertyId, config).catch((err) => {
    console.error(`[SEO Audit ${audit.id}] Background execution fatal error:`, err);
  });

  return audit.id;
}

// ─── Background Execution ──────────────────────────────────────────

async function runAuditInBackground(
  auditId: string | number,
  propertyId: string | number,
  config: CrawlConfig
): Promise<void> {
  const tracker = { cancelled: false };
  runningAudits.set(auditId, tracker);

  try {
    // Get the property domain
    const property = await prisma.websiteProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      await prisma.seoAudit.update({
        where: { id: auditId },
        data: { status: "FAILED", errorMessage: "Property not found" },
      });
      return;
    }

    // Mark as RUNNING
    await prisma.seoAudit.update({
      where: { id: auditId },
      data: { status: "RUNNING", startTime: new Date() },
    });

    const rootUrl = property.domain.startsWith("http")
      ? property.domain
      : `https://${property.domain}`;

    const pageScores: number[] = [];
    const titleSet = new Map<string, number[]>(); // title -> pageIds
    const metaDescSet = new Map<string, number[]>(); // desc -> pageIds

    // Crawl the site
    const result = await crawlSite(rootUrl, config, {
      onPageCrawled: async (page: CrawledPage) => {
        try {
          // Analyze the page HTML
          const analysis = page.html
            ? analyzeHtml(page.html, page.url)
            : {
                title: null, titleLength: 0,
                metaDescription: null, metaDescLength: 0,
                h1: null, h1Count: 0, h2Count: 0, h3Count: 0,
                canonical: null, canonicalIsValid: null,
                robotsMeta: null, isNoindex: false, isNofollow: false,
                wordCount: 0, imageCount: 0, missingAltCount: 0,
                internalLinks: 0, externalLinks: 0, isIndexable: true,
              };

          // Extract link counts from HTML
          if (page.html) {
            const links = extractLinks(page.html, page.url, rootUrl);
            analysis.internalLinks = links.internal.length;
            analysis.externalLinks = links.external.length;
          }

          // Create SeoPage record
          const seoPage = await prisma.seoPage.create({
            data: {
              auditId,
              url: page.url,
              normalizedUrl: page.normalizedUrl,
              statusCode: page.statusCode,
              finalUrl: page.finalUrl,
              contentType: page.contentType,
              responseMs: page.responseMs,
              htmlSize: page.htmlSize,
              wordCount: analysis.wordCount,
              title: analysis.title,
              titleLength: analysis.titleLength,
              metaDescription: analysis.metaDescription,
              metaDescLength: analysis.metaDescLength,
              h1: analysis.h1,
              h1Count: analysis.h1Count,
              h2Count: analysis.h2Count,
              h3Count: analysis.h3Count,
              canonical: analysis.canonical,
              canonicalIsValid: analysis.canonicalIsValid,
              robotsMeta: analysis.robotsMeta,
              isNoindex: analysis.isNoindex,
              isNofollow: analysis.isNofollow,
              internalLinks: analysis.internalLinks,
              externalLinks: analysis.externalLinks,
              imageCount: analysis.imageCount,
              missingAltCount: analysis.missingAltCount,
              isIndexable: analysis.isIndexable,
              depth: page.depth,
              redirectChain: page.redirectChain.length > 0 ? JSON.stringify(page.redirectChain) : null,
            },
          });

          // Detect issues
          const issues = detectIssues(
            analysis,
            page.statusCode,
            page.responseMs,
            page.htmlSize,
            page.redirectChain,
            page.error
          );

          // Save issues
          if (issues.length > 0) {
            await prisma.seoIssue.createMany({
              data: issues.map((issue) => ({
                auditId,
                pageId: seoPage.id,
                type: issue.type,
                severity: issue.severity,
                description: issue.description,
                recommendation: issue.recommendation,
                url: page.url,
              })),
            });
          }

          // Track page score
          const pageScore = calculatePageScore(issues);
          pageScores.push(pageScore);

          // Track duplicates
          if (analysis.title && analysis.title.trim()) {
            const key = analysis.title.trim().toLowerCase();
            if (!titleSet.has(key)) titleSet.set(key, []);
            titleSet.get(key)!.push(seoPage.id);
          }
          if (analysis.metaDescription && analysis.metaDescription.trim()) {
            const key = analysis.metaDescription.trim().toLowerCase();
            if (!metaDescSet.has(key)) metaDescSet.set(key, []);
            metaDescSet.get(key)!.push(seoPage.id);
          }
        } catch (err) {
          console.error(`[SEO Audit ${auditId}] Error processing page ${page.url}:`, err);
        }
      },

      shouldCancel: async () => {
        if (tracker.cancelled) return true;
        // Also check DB status in case it was set externally
        try {
          const audit = await prisma.seoAudit.findUnique({
            where: { id: auditId },
            select: { status: true },
          });
          if (audit?.status === "CANCELLED") {
            tracker.cancelled = true;
            return true;
          }
        } catch { /* continue */ }
        return false;
      },

      onProgress: async (progress) => {
        try {
          await prisma.seoAudit.update({
            where: { id: auditId },
            data: {
              pagesDiscovered: progress.pagesDiscovered,
              pagesCrawled: progress.pagesCrawled,
            },
          });
        } catch { /* non-critical */ }
      },
    });

    // Generate duplicate issues (audit-level, not per-page)
    for (const [title, pageIds] of titleSet) {
      if (pageIds.length > 1) {
        await prisma.seoIssue.createMany({
          data: pageIds.map((pageId) => ({
            auditId,
            pageId,
            type: "DUPLICATE_TITLE",
            severity: "MEDIUM" as const,
            description: `Duplicate title found on ${pageIds.length} pages: "${title.substring(0, 60)}..."`,
            recommendation: "Ensure each page has a unique title tag.",
          })),
        });
      }
    }

    for (const [desc, pageIds] of metaDescSet) {
      if (pageIds.length > 1) {
        await prisma.seoIssue.createMany({
          data: pageIds.map((pageId) => ({
            auditId,
            pageId,
            type: "DUPLICATE_META_DESCRIPTION",
            severity: "MEDIUM" as const,
            description: `Duplicate meta description found on ${pageIds.length} pages`,
            recommendation: "Write a unique meta description for each page.",
          })),
        });
      }
    }

    // Calculate final counts and score
    const issueCounts = await prisma.seoIssue.groupBy({
      by: ["severity"],
      where: { auditId },
      _count: { id: true },
    });

    const countMap: Record<string, number> = {};
    for (const row of issueCounts) {
      countMap[row.severity] = row._count.id;
    }

    const finalScore = calculateSiteScore(pageScores);
    const finalStatus = result.status === "CANCELLED" ? "CANCELLED" : "COMPLETED";

    await prisma.seoAudit.update({
      where: { id: auditId },
      data: {
        status: finalStatus,
        score: finalScore,
        pagesDiscovered: result.pagesDiscovered,
        pagesCrawled: result.pagesCrawled,
        issuesCritical: countMap["CRITICAL"] || 0,
        issuesHigh: countMap["HIGH"] || 0,
        issuesMedium: countMap["MEDIUM"] || 0,
        issuesLow: countMap["LOW"] || 0,
        issuesInfo: countMap["INFO"] || 0,
        endTime: new Date(),
      },
    });
  } catch (err: any) {
    console.error(`[SEO Audit ${auditId}] Fatal error:`, err);
    try {
      await prisma.seoAudit.update({
        where: { id: auditId },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Unknown error",
          endTime: new Date(),
        },
      });
    } catch { /* last resort */ }
  } finally {
    runningAudits.delete(auditId);
  }
}

// ─── Cancel Audit ──────────────────────────────────────────────────

export async function cancelAudit(auditId: string | number): Promise<boolean> {
  const tracker = runningAudits.get(auditId);
  if (tracker) {
    tracker.cancelled = true;
  }

  // Also update DB directly (in case the background loop checks DB)
  await prisma.seoAudit.update({
    where: { id: auditId },
    data: { status: "CANCELLED", endTime: new Date() },
  });

  return true;
}

// ─── Get Audits ────────────────────────────────────────────────────

export async function getAudits(filters: {
  propertyId?: string | number;
  clientId?: string | number;
  status?: string;
}): Promise<AuditSummary[]> {
  const where: any = {};

  if (filters.propertyId) {
    where.propertyId = filters.propertyId;
  }

  if (filters.clientId) {
    where.property = { clientId: filters.clientId };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const audits = await prisma.seoAudit.findMany({
    where,
    include: {
      property: {
        include: {
          client: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return audits.map((a: any) => ({
    id: a.id,
    propertyId: a.propertyId,
    status: a.status,
    score: a.score,
    pagesDiscovered: a.pagesDiscovered,
    pagesCrawled: a.pagesCrawled,
    issuesCritical: a.issuesCritical,
    issuesHigh: a.issuesHigh,
    issuesMedium: a.issuesMedium,
    issuesLow: a.issuesLow,
    issuesInfo: a.issuesInfo,
    startTime: a.startTime?.toISOString() || null,
    endTime: a.endTime?.toISOString() || null,
    createdAt: a.createdAt?.toISOString?.() || new Date(a.createdAt).toISOString(),
    domain: a.property?.domain || "Domain",
    clientName: a.property?.client?.name || "Client",
    errorMessage: a.errorMessage,
  }));
}

// ─── Get Single Audit ──────────────────────────────────────────────

export async function getAuditById(auditId: string | number): Promise<AuditSummary | null> {
  const a = await prisma.seoAudit.findUnique({
    where: { id: auditId },
    include: {
      property: {
        include: {
          client: { select: { name: true } },
        },
      },
    },
  });

  if (!a) return null;

  return {
    id: a.id,
    propertyId: a.propertyId,
    status: a.status,
    score: a.score,
    pagesDiscovered: a.pagesDiscovered,
    pagesCrawled: a.pagesCrawled,
    issuesCritical: a.issuesCritical,
    issuesHigh: a.issuesHigh,
    issuesMedium: a.issuesMedium,
    issuesLow: a.issuesLow,
    issuesInfo: a.issuesInfo,
    startTime: a.startTime?.toISOString() || null,
    endTime: a.endTime?.toISOString() || null,
    createdAt: a.createdAt.toISOString(),
    domain: a.property.domain,
    clientName: a.property.client.name,
    errorMessage: a.errorMessage,
  };
}

// ─── Get Audit Pages ───────────────────────────────────────────────

export async function getAuditPages(
  auditId: string | number,
  options: { page?: number; limit?: number; search?: string; status?: string }
) {
  const take = Math.min(options.limit || 50, 100);
  const skip = ((options.page || 1) - 1) * take;

  const where: any = { auditId };

  if (options.search) {
    where.url = { contains: options.search };
  }

  if (options.status) {
    if (options.status === "error") {
      where.statusCode = { gte: 400 };
    } else if (options.status === "redirect") {
      where.statusCode = { gte: 300, lt: 400 };
    } else if (options.status === "ok") {
      where.statusCode = { gte: 200, lt: 300 };
    }
  }

  const [pages, total] = await Promise.all([
    prisma.seoPage.findMany({
      where,
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { id: "asc" },
      skip,
      take,
    }),
    prisma.seoPage.count({ where }),
  ]);

  return {
    pages: pages.map((p: any) => ({
      id: p.id,
      url: p.url,
      statusCode: p.statusCode,
      title: p.title,
      titleLength: p.titleLength,
      metaDescription: p.metaDescription,
      metaDescLength: p.metaDescLength,
      h1: p.h1,
      h1Count: p.h1Count,
      canonical: p.canonical,
      canonicalIsValid: p.canonicalIsValid,
      isNoindex: p.isNoindex,
      wordCount: p.wordCount,
      responseMs: p.responseMs,
      imageCount: p.imageCount,
      missingAltCount: p.missingAltCount,
      internalLinks: p.internalLinks,
      externalLinks: p.externalLinks,
      depth: p.depth,
      issueCount: p._count?.issues || 0,
    })),
    total,
    page: options.page || 1,
    totalPages: Math.ceil(total / take),
  };
}

// ─── Get Audit Issues ──────────────────────────────────────────────

export async function getAuditIssues(
  auditId: string | number,
  options: { severity?: string; type?: string; page?: number; limit?: number }
) {
  const take = Math.min(options.limit || 50, 100);
  const skip = ((options.page || 1) - 1) * take;

  const where: any = { auditId };
  if (options.severity) where.severity = options.severity;
  if (options.type) where.type = options.type;

  const [issues, total] = await Promise.all([
    prisma.seoIssue.findMany({
      where,
      include: {
        page: { select: { url: true, statusCode: true } },
      },
      orderBy: [
        { severity: "asc" }, // CRITICAL first (alphabetical order works: C < H < I < L < M)
        { type: "asc" },
      ],
      skip,
      take,
    }),
    prisma.seoIssue.count({ where }),
  ]);

  return {
    issues: issues.map((i: any) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      description: i.description,
      recommendation: i.recommendation,
      url: i.url,
      pageUrl: i.page?.url || null,
      pageStatusCode: i.page?.statusCode || null,
    })),
    total,
    page: options.page || 1,
    totalPages: Math.ceil(total / take),
  };
}

// ─── Delete Audit ──────────────────────────────────────────────────

export async function deleteAudit(auditId: string | number): Promise<void> {
  // Cancel if running
  const tracker = runningAudits.get(auditId);
  if (tracker) tracker.cancelled = true;

  await prisma.seoAudit.delete({ where: { id: auditId } });
}

// ─── Get latest audit for a property ───────────────────────────────

export async function getLatestAuditForProperty(propertyId: string | number): Promise<AuditSummary | null> {
  const a = await prisma.seoAudit.findFirst({
    where: { propertyId },
    include: {
      property: {
        include: { client: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!a) return null;

  return {
    id: a.id,
    propertyId: a.propertyId,
    status: a.status,
    score: a.score,
    pagesDiscovered: a.pagesDiscovered,
    pagesCrawled: a.pagesCrawled,
    issuesCritical: a.issuesCritical,
    issuesHigh: a.issuesHigh,
    issuesMedium: a.issuesMedium,
    issuesLow: a.issuesLow,
    issuesInfo: a.issuesInfo,
    startTime: a.startTime?.toISOString() || null,
    endTime: a.endTime?.toISOString() || null,
    createdAt: a.createdAt?.toISOString?.() || new Date(a.createdAt).toISOString(),
    domain: a.property?.domain || "Domain",
    clientName: a.property?.client?.name || "Client",
    errorMessage: a.errorMessage,
  };
}
