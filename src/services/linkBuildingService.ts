import prisma from "@/lib/db";
import { URL } from "url";
import dns from "dns";
import * as cheerio from "cheerio";

// ====================================================
// SSRF & SECURITY CHECK HELPERS
// ====================================================

export async function isSafeIp(ip: string): Promise<boolean> {
  // IPv4 checks
  if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.some(isNaN)) return false;
    
    const [first, second] = parts;
    // Loopback (127.0.0.0/8)
    if (first === 127) return false;
    // Private ranges (10.0.0.0/8)
    if (first === 10) return false;
    // Private ranges (172.16.0.0/12)
    if (first === 172 && second >= 16 && second <= 31) return false;
    // Private ranges (192.168.0.0/16)
    if (first === 192 && second === 168) return false;
    // Link-local (169.254.0.0/16)
    if (first === 169 && second === 254) return false;
    // Unspecified / Broadcast
    if (first === 0 || first === 255) return false;

    return true;
  }

  // IPv6 checks
  if (ip.includes(":")) {
    const clean = ip.toLowerCase().trim();
    if (clean === "::1" || clean === "::" || clean.startsWith("0:0:0:0:0:0:0")) return false;
    // Link local (fe80::)
    if (clean.startsWith("fe80")) return false;
    // Unique local (fc00::, fd00::)
    if (clean.startsWith("fc00") || clean.startsWith("fd00")) return false;
    
    return true;
  }

  return false;
}

export async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    
    const host = parsed.hostname;
    const ips = await new Promise<string[]>((resolve) => {
      dns.resolve(host, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          resolve([]);
        } else {
          resolve(addresses);
        }
      });
    });

    if (ips.length === 0) {
      if (await isSafeIp(host) === false) return false;
      return true;
    }

    for (const ip of ips) {
      const safe = await isSafeIp(ip);
      if (!safe) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ====================================================
// CORE LINK BUILDING LOGIC
// ====================================================

export const getLinkOverview = async (clientId?: string | number) => {
  const today = new Date();
  
  const campaignWhere = clientId ? { clientId } : {};
  const relationWhere = clientId ? { campaign: { clientId } } : {};

  const [
    totalCampaigns,
    activeCampaigns,
    totalProspects,
    qualifiedProspects,
    contactedProspects,
    acquiredLinks,
    liveLinks,
    brokenLinks,
    pendingVerification,
    upcomingFollowUps,
    overdueFollowUps,
  ] = await Promise.all([
    // Active / total campaigns
    prisma.linkCampaign.count({ where: campaignWhere }),
    prisma.linkCampaign.count({ where: { ...campaignWhere, status: "ACTIVE" } }),
    // Opportunities
    prisma.linkOpportunity.count({ where: relationWhere }),
    prisma.linkOpportunity.count({ where: { ...relationWhere, status: "QUALIFIED" } }),
    prisma.linkOpportunity.count({ where: { ...relationWhere, status: "CONTACTED" } }),
    // Acquired Links
    prisma.acquiredBacklink.count({ where: relationWhere }),
    prisma.acquiredBacklink.count({ where: { ...relationWhere, status: "LIVE" } }),
    prisma.acquiredBacklink.count({
      where: {
        ...relationWhere,
        status: { in: ["MISSING", "BROKEN"] },
      },
    }),
    prisma.acquiredBacklink.count({ where: { ...relationWhere, status: "PENDING_VERIFICATION" } }),
    // Follow-ups
    prisma.linkOpportunity.count({
      where: {
        ...relationWhere,
        followUpDate: { gte: today },
        status: { notIn: ["REJECTED", "ACQUIRED", "LOST"] },
      },
    }),
    prisma.linkOpportunity.count({
      where: {
        ...relationWhere,
        followUpDate: { lt: today },
        status: { notIn: ["REJECTED", "ACQUIRED", "LOST"] },
      },
    }),
  ]);

  // Denominator: sum of qualified and contacted prospects (or 1 fallback to avoid dividing by 0)
  const totalQualifiedOrContacted = qualifiedProspects + contactedProspects;
  const acquisitionRate = totalQualifiedOrContacted > 0 ? (acquiredLinks / totalQualifiedOrContacted) * 100 : 0;
  
  // Verification success rate: live links / acquired links
  const verificationSuccessRate = acquiredLinks > 0 ? (liveLinks / acquiredLinks) * 100 : 0;

  return {
    totalCampaigns,
    activeCampaigns,
    totalProspects,
    qualifiedProspects,
    contactedProspects,
    acquiredLinks,
    liveLinks,
    brokenLinks,
    pendingVerification,
    upcomingFollowUps,
    overdueFollowUps,
    acquisitionRate,
    verificationSuccessRate,
  };
};

export const getCampaigns = async (filters: {
  search?: string;
  clientId?: string | number;
  status?: string;
  priority?: string;
}) => {
  const where: any = {};

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
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
      { objective: { contains: filters.search } },
    ];
  }

  return prisma.linkCampaign.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      _count: {
        select: {
          opportunities: true,
          acquiredLinks: true,
          tasks: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
};

export const getCampaignDetail = async (campaignId: string | number) => {
  const campaign = await prisma.linkCampaign.findUnique({
    where: { id: campaignId },
    include: {
      client: { select: { id: true, name: true } },
      opportunities: {
        orderBy: { updatedAt: "desc" },
      },
      acquiredLinks: {
        orderBy: { updatedAt: "desc" },
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

// ====================================================
// REAL LINK VERIFICATION ENGINE
// ====================================================

export const verifyAcquiredBacklink = async (backlinkId: string | number) => {
  const backlink = await prisma.acquiredBacklink.findUnique({
    where: { id: backlinkId },
    include: {
      campaign: { include: { client: true } },
    },
  });

  if (!backlink) {
    return { error: "Backlink record not found." };
  }

  const { sourceUrl, targetUrl } = backlink;

  // Validate URL Safety
  const safe = await isSafeUrl(sourceUrl);
  if (!safe) {
    await prisma.acquiredBacklink.update({
      where: { id: backlinkId },
      data: {
        status: "UNKNOWN",
        notes: "Verification failed: URL flagged as unsafe (private IP or localhost resolved).",
        lastCheckedAt: new Date(),
      },
    });
    return { status: "UNKNOWN", error: "Source URL resolves to a local or private address range." };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout limit

    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MisterSKLinkChecker/1.0 (SEO Audit Crawler; Link Verification)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const updated = await prisma.acquiredBacklink.update({
        where: { id: backlinkId },
        data: {
          status: "BROKEN",
          notes: `HTTP Error: ${res.status} ${res.statusText}`,
          lastCheckedAt: new Date(),
        },
      });
      return { status: "BROKEN", error: `HTTP ${res.status} error` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const finalUrl = res.url || sourceUrl;

    const targetUrlParsed = new URL(targetUrl);
    const targetDomain = targetUrlParsed.hostname.toLowerCase().replace("www.", "");

    let foundLink: any = null;

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      try {
        const resolvedHref = new URL(href, finalUrl).toString().toLowerCase();
        if (resolvedHref.includes(targetDomain)) {
          foundLink = {
            href: $(el).attr("href"),
            anchorText: $(el).text().trim() || "[No Text / Image Anchor]",
            rel: $(el).attr("rel") || "",
          };
          return false;
        }
      } catch {
        // Skip malformed individual hrefs
      }
    });

    if (!foundLink) {
      const updated = await prisma.acquiredBacklink.update({
        where: { id: backlinkId },
        data: {
          status: "MISSING",
          notes: `Inspected ${finalUrl} but found no links pointing to ${targetDomain}`,
          lastCheckedAt: new Date(),
        },
      });
      return { status: "MISSING" };
    }

    const rels = foundLink.rel.toLowerCase();
    let status = "LIVE";
    let linkType = "FOLLOW";

    if (rels.includes("nofollow")) {
      linkType = "NOFOLLOW";
    } else if (rels.includes("sponsored")) {
      linkType = "SPONSORED";
    } else if (rels.includes("ugc")) {
      linkType = "UGC";
    }

    // Update DB
    const dataToUpdate: any = {
      status,
      linkType,
      anchorText: foundLink.anchorText,
      lastCheckedAt: new Date(),
      notes: `Link verified live on ${new Date().toLocaleDateString()}`,
    };

    if (!backlink.firstVerifiedAt) {
      dataToUpdate.firstVerifiedAt = new Date();
    }

    const updated = await prisma.acquiredBacklink.update({
      where: { id: backlinkId },
      data: dataToUpdate,
    });

    return {
      status,
      linkType,
      anchorText: foundLink.anchorText,
      relAttributes: foundLink.rel,
      finalUrl,
    };
  } catch (err: any) {
    let errorMsg = err.message || "Failed to fetch source page";
    if (err.name === "AbortError") {
      errorMsg = "Request timed out after 8s limit.";
    }

    const updated = await prisma.acquiredBacklink.update({
      where: { id: backlinkId },
      data: {
        status: "UNKNOWN",
        notes: `Verification error: ${errorMsg}`,
        lastCheckedAt: new Date(),
      },
    });

    return { status: "UNKNOWN", error: errorMsg };
  }
};

// Activity logging helper
export const logLinkActivity = async (
  actorEmail: string,
  action: string,
  clientId: string | number,
  clientName: string,
  metadata: any
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
    console.error("Failed to log Link activity:", err);
  }
};
