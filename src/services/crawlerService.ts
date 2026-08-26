/**
 * Crawler Service
 *
 * Core crawling engine that fetches pages, discovers internal links,
 * respects robots.txt, parses sitemaps, and normalizes URLs.
 *
 * Safety features:
 * - SSRF protection (blocks private/local IPs)
 * - Concurrency limiting via p-limit
 * - Maximum page cap
 * - Per-request timeout
 * - Max response body size
 * - Duplicate URL prevention via normalized URL set
 * - Depth limiting
 */

import * as cheerio from "cheerio";
import { URL } from "url";
import dns from "dns/promises";
import net from "net";

// ─── Types ──────────────────────────────────────────────────────────

export interface CrawlConfig {
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  timeoutMs: number;
  respectRobots: boolean;
  followRedirects: boolean;
  maxBodyBytes: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export const DEFAULT_CRAWL_CONFIG: CrawlConfig = {
  maxPages: 100,
  maxDepth: 5,
  concurrency: 3,
  timeoutMs: 15000,
  respectRobots: true,
  followRedirects: true,
  maxBodyBytes: 5 * 1024 * 1024, // 5 MB
};

export interface CrawledPage {
  url: string;
  normalizedUrl: string;
  statusCode: number | null;
  finalUrl: string | null;
  contentType: string | null;
  responseMs: number;
  htmlSize: number;
  html: string;
  redirectChain: string[];
  depth: number;
  error?: string;
}

export interface CrawlProgress {
  pagesDiscovered: number;
  pagesCrawled: number;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
}

// ─── Tracking parameters to strip ──────────────────────────────────

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "gclsrc", "dclid", "msclkid",
  "mc_cid", "mc_eid", "ref", "affiliate",
]);

// ─── SSRF Protection ───────────────────────────────────────────────

const PRIVATE_RANGES = [
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
  { start: "169.254.0.0", end: "169.254.255.255" },
  { start: "0.0.0.0", end: "0.255.255.255" },
];

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIP(ip: string): boolean {
  if (net.isIPv6(ip)) return ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd");
  if (!net.isIPv4(ip)) return true; // Treat non-IP as private (safe default)
  const ipInt = ipToInt(ip);
  return PRIVATE_RANGES.some(r => ipInt >= ipToInt(r.start) && ipInt <= ipToInt(r.end));
}

export async function validateHostSSRF(hostname: string): Promise<void> {
  // Block localhost explicitly
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "::1" || lower === "0.0.0.0") {
    throw new Error(`SSRF: Blocked request to ${hostname}`);
  }

  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        throw new Error(`SSRF: Blocked request to private IP ${addr} for ${hostname}`);
      }
    }
  } catch (err: unknown) {
    const errorObj = err as Error;
    if (errorObj?.message?.startsWith("SSRF")) throw err;
    // DNS resolution failure — let fetch handle it
  }
}

// ─── URL Normalization ─────────────────────────────────────────────

export function normalizeUrl(rawUrl: string, baseUrl?: string): string | null {
  try {
    const parsed = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

    // Only crawl http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    // Upgrade to https canonically
    parsed.protocol = "https:";

    // Lowercase host
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove default port
    parsed.port = "";

    // Remove fragment
    parsed.hash = "";

    // Strip tracking params
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(k => parsed.searchParams.delete(k));

    // Sort remaining params for determinism
    parsed.searchParams.sort();

    // Normalize path: remove trailing slash except for root
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    parsed.pathname = path;

    return parsed.toString();
  } catch {
    return null;
  }
}

// ─── Robots.txt Parser ─────────────────────────────────────────────

export interface RobotsRules {
  disallowed: string[];
  allowed: string[];
  sitemaps: string[];
}

export function parseRobotsTxt(text: string): RobotsRules {
  const rules: RobotsRules = { disallowed: [], allowed: [], sitemaps: [] };
  let isRelevantAgent = false;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const directive = line.substring(0, colonIdx).trim().toLowerCase();
    const value = line.substring(colonIdx + 1).trim();

    if (directive === "user-agent") {
      isRelevantAgent = value === "*" || value.toLowerCase().includes("mistersk");
    } else if (directive === "sitemap") {
      rules.sitemaps.push(value);
    } else if (isRelevantAgent) {
      if (directive === "disallow" && value) {
        rules.disallowed.push(value);
      } else if (directive === "allow" && value) {
        rules.allowed.push(value);
      }
    }
  }

  return rules;
}

export function isPathAllowed(path: string, rules: RobotsRules): boolean {
  // Check allow first (more specific wins, but for simplicity: allow overrides disallow for matching prefix)
  for (const pattern of rules.allowed) {
    if (path.startsWith(pattern)) return true;
  }
  for (const pattern of rules.disallowed) {
    if (pattern === "/" || path.startsWith(pattern)) return false;
  }
  return true;
}

// ─── Sitemap Parser ────────────────────────────────────────────────

export function parseSitemap(xml: string, _baseDomain?: string): string[] {
  const urls: string[] = [];
  const $ = cheerio.load(xml, { xmlMode: true });

  // Standard <url><loc>
  $("url > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) urls.push(loc);
  });

  // Sitemap index <sitemap><loc>
  $("sitemap > loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) urls.push(loc);
  });

  return urls;
}

// ─── Link Extraction ───────────────────────────────────────────────

export interface ExtractedLinks {
  internal: string[];
  external: string[];
}

export function extractLinks(html: string, pageUrl: string, baseDomain: string): ExtractedLinks {
  const $ = cheerio.load(html);
  const internal: string[] = [];
  const external: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    // Skip non-navigable
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:") || href.startsWith("#")) return;

    const normalized = normalizeUrl(href, pageUrl);
    if (!normalized) return;

    try {
      const linkHost = new URL(normalized).hostname;
      const baseHost = new URL(baseDomain).hostname;
      // Compare root domain
      if (linkHost === baseHost || linkHost.endsWith("." + baseHost)) {
        internal.push(normalized);
      } else {
        external.push(normalized);
      }
    } catch {
      // Ignore malformed
    }
  });

  return { internal, external };
}

// ─── Core Fetch ────────────────────────────────────────────────────

async function fetchPage(
  url: string,
  config: CrawlConfig
): Promise<CrawledPage> {
  const startTime = Date.now();
  const redirectChain: string[] = [];
  const currentUrl = url;
  let statusCode: number | null = null;
  let html = "";
  let contentType: string | null = null;
  let finalUrl: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    const response = await fetch(currentUrl, {
      signal: controller.signal,
      redirect: config.followRedirects ? "follow" : "manual",
      headers: {
        "User-Agent": "MisterSKBot/1.0 (+https://mistersk.com/bot)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeout);
    statusCode = response.status;
    contentType = response.headers.get("content-type");
    finalUrl = response.url !== url ? response.url : null;

    // Track redirects
    if (response.redirected && response.url !== url) {
      redirectChain.push(response.url);
    }

    // Only parse HTML
    if (contentType && contentType.includes("text/html")) {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length > config.maxBodyBytes) {
        html = new TextDecoder().decode(bytes.slice(0, config.maxBodyBytes));
      } else {
        html = new TextDecoder().decode(bytes);
      }
    }

    return {
      url,
      normalizedUrl: normalizeUrl(url) || url,
      statusCode,
      finalUrl,
      contentType,
      responseMs: Date.now() - startTime,
      htmlSize: html.length,
      html,
      redirectChain,
      depth: 0, // Set by caller
    };
  } catch (err: unknown) {
    const errorObj = err as Error;
    return {
      url,
      normalizedUrl: normalizeUrl(url) || url,
      statusCode: null,
      finalUrl: null,
      contentType: null,
      responseMs: Date.now() - startTime,
      htmlSize: 0,
      html: "",
      redirectChain: [],
      depth: 0,
      error: errorObj?.name === "AbortError" ? "Request timed out" : (errorObj?.message || "Unknown crawl error"),
    };
  }
}

// ─── Main Crawler ──────────────────────────────────────────────────

export interface CrawlCallbacks {
  onPageCrawled: (page: CrawledPage) => Promise<void>;
  shouldCancel: () => Promise<boolean>;
  onProgress: (progress: CrawlProgress) => Promise<void>;
}

export async function crawlSite(
  rootUrl: string,
  config: CrawlConfig,
  callbacks: CrawlCallbacks
): Promise<CrawlProgress> {
  // Dynamic import of p-limit (ESM)
  const pLimit = (await import("p-limit")).default;
  const limit = pLimit(config.concurrency);

  const baseParsed = new URL(rootUrl);
  const baseDomain = `${baseParsed.protocol}//${baseParsed.hostname}`;

  // SSRF check on the root domain
  await validateHostSSRF(baseParsed.hostname);

  // Fetch and parse robots.txt
  let robotsRules: RobotsRules = { disallowed: [], allowed: [], sitemaps: [] };
  if (config.respectRobots) {
    try {
      const robotsResp = await fetch(`${baseDomain}/robots.txt`, {
        signal: AbortSignal.timeout(config.timeoutMs),
        headers: { "User-Agent": "MisterSKBot/1.0" },
      });
      if (robotsResp.ok) {
        const text = await robotsResp.text();
        robotsRules = parseRobotsTxt(text);
      }
    } catch {
      // robots.txt not available — crawl everything
    }
  }

  // URL queue: [url, depth]
  const queue: Array<[string, number]> = [];
  const visited = new Set<string>();
  let pagesCrawled = 0;

  // Seed with root URL
  const rootNorm = normalizeUrl(rootUrl);
  if (rootNorm) {
    queue.push([rootUrl, 0]);
    visited.add(rootNorm);
  }

  // Try to discover sitemap URLs
  const sitemapUrls = [...robotsRules.sitemaps];
  if (sitemapUrls.length === 0) {
    sitemapUrls.push(`${baseDomain}/sitemap.xml`);
  }

  for (const sitemapUrl of sitemapUrls) {
    try {
      const resp = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(config.timeoutMs),
        headers: { "User-Agent": "MisterSKBot/1.0" },
      });
      if (resp.ok) {
        const xml = await resp.text();
        const discovered = parseSitemap(xml, baseDomain);
        for (const u of discovered) {
          const norm = normalizeUrl(u);
          if (norm && !visited.has(norm)) {
            // Check if it's internal
            try {
              const h = new URL(norm).hostname;
              if (h === baseParsed.hostname || h.endsWith("." + baseParsed.hostname)) {
                visited.add(norm);
                queue.push([u, 1]);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      // Sitemap not available
    }
  }

  // Process queue
  const progress: CrawlProgress = {
    pagesDiscovered: visited.size,
    pagesCrawled: 0,
    status: "RUNNING",
  };

  while (queue.length > 0 && pagesCrawled < config.maxPages) {
    // Check cancellation
    if (await callbacks.shouldCancel()) {
      progress.status = "CANCELLED";
      break;
    }

    // Process batch
    const batchSize = Math.min(config.concurrency, config.maxPages - pagesCrawled, queue.length);
    const batch = queue.splice(0, batchSize);

    const results = await Promise.all(
      batch.map(([url, depth]) =>
        limit(async () => {
          // Check robots
          if (config.respectRobots) {
            try {
              const urlPath = new URL(url).pathname;
              if (!isPathAllowed(urlPath, robotsRules)) {
                return null; // Blocked by robots.txt
              }
            } catch { /* skip check */ }
          }

          // Check include/exclude patterns
          if (config.excludePatterns && config.excludePatterns.length > 0) {
            if (config.excludePatterns.some(p => url.includes(p))) return null;
          }
          if (config.includePatterns && config.includePatterns.length > 0) {
            if (!config.includePatterns.some(p => url.includes(p))) return null;
          }

          const page = await fetchPage(url, config);
          page.depth = depth;
          return page;
        })
      )
    );

    for (const page of results) {
      if (!page) continue;

      pagesCrawled++;
      progress.pagesCrawled = pagesCrawled;

      await callbacks.onPageCrawled(page);

      // Discover new internal links from HTML
      if (page.html && page.depth < config.maxDepth) {
        const links = extractLinks(page.html, page.url, baseDomain);
        for (const link of links.internal) {
          const norm = normalizeUrl(link);
          if (norm && !visited.has(norm) && queue.length + visited.size < config.maxPages * 3) {
            visited.add(norm);
            queue.push([link, page.depth + 1]);
            progress.pagesDiscovered = visited.size;
          }
        }
      }
    }

    await callbacks.onProgress(progress);
  }

  if (progress.status === "RUNNING") {
    progress.status = "COMPLETED";
  }

  return progress;
}
