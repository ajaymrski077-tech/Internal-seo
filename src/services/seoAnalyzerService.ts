/**
 * SEO Analyzer Service
 *
 * Takes raw HTML + HTTP metadata and extracts SEO signals.
 * Evaluates against a centralized ruleset to produce SeoIssue records.
 *
 * All SEO rules and thresholds are defined here, not in React components.
 */

import * as cheerio from "cheerio";

// ─── Types ──────────────────────────────────────────────────────────

export interface PageAnalysis {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescLength: number;
  h1: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  canonical: string | null;
  canonicalIsValid: boolean | null;
  robotsMeta: string | null;
  isNoindex: boolean;
  isNofollow: boolean;
  wordCount: number;
  imageCount: number;
  missingAltCount: number;
  internalLinks: number;
  externalLinks: number;
  isIndexable: boolean;
}

export interface SeoIssueRecord {
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  description: string;
  recommendation: string | null;
}

// ─── Thresholds ────────────────────────────────────────────────────

export const SEO_THRESHOLDS = {
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 70,
  META_DESC_MIN_LENGTH: 50,
  META_DESC_MAX_LENGTH: 160,
  MIN_WORD_COUNT: 100,
  MAX_RESPONSE_MS: 3000,
  MAX_HTML_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB
};

// ─── Issue Type Catalog ────────────────────────────────────────────

export const ISSUE_TYPES = {
  MISSING_TITLE: { severity: "HIGH" as const, desc: "Page is missing a <title> tag", rec: "Add a unique, descriptive title tag (10-70 characters)." },
  EMPTY_TITLE: { severity: "HIGH" as const, desc: "Page has an empty <title> tag", rec: "Add descriptive text to the title tag." },
  TITLE_TOO_SHORT: { severity: "MEDIUM" as const, desc: "Title tag is shorter than 10 characters", rec: "Expand the title to at least 10 characters for better search visibility." },
  TITLE_TOO_LONG: { severity: "MEDIUM" as const, desc: "Title tag exceeds 70 characters", rec: "Shorten the title to under 70 characters to avoid truncation in search results." },
  MISSING_META_DESCRIPTION: { severity: "HIGH" as const, desc: "Page is missing a meta description", rec: "Add a compelling meta description (50-160 characters)." },
  EMPTY_META_DESCRIPTION: { severity: "HIGH" as const, desc: "Page has an empty meta description", rec: "Add descriptive text to the meta description." },
  META_DESC_TOO_SHORT: { severity: "MEDIUM" as const, desc: "Meta description is shorter than 50 characters", rec: "Expand the description to at least 50 characters." },
  META_DESC_TOO_LONG: { severity: "MEDIUM" as const, desc: "Meta description exceeds 160 characters", rec: "Shorten the description to under 160 characters." },
  MISSING_H1: { severity: "HIGH" as const, desc: "Page is missing an H1 heading", rec: "Add a single, descriptive H1 heading to the page." },
  MULTIPLE_H1: { severity: "MEDIUM" as const, desc: "Page has multiple H1 headings", rec: "Use only one H1 per page. Convert extras to H2 or H3." },
  MISSING_CANONICAL: { severity: "MEDIUM" as const, desc: "Page is missing a canonical link tag", rec: "Add a self-referencing canonical link tag." },
  CANONICAL_MISMATCH: { severity: "MEDIUM" as const, desc: "Canonical URL points to a different page", rec: "Verify that the canonical URL is correct. A mismatched canonical may reduce indexation." },
  MISSING_ALT_TEXT: { severity: "MEDIUM" as const, desc: "Image(s) missing alt attribute", rec: "Add descriptive alt text to all images for accessibility and SEO." },
  NOINDEX_PAGE: { severity: "INFO" as const, desc: "Page has a noindex directive", rec: "Verify that this page should be excluded from search engines." },
  LOW_WORD_COUNT: { severity: "LOW" as const, desc: "Page has fewer than 100 words of content", rec: "Add more substantive content to improve relevance signals." },
  LARGE_PAGE: { severity: "LOW" as const, desc: "HTML document exceeds 2 MB", rec: "Reduce page size for faster loading." },
  SLOW_RESPONSE: { severity: "MEDIUM" as const, desc: "Page response time exceeds 3 seconds", rec: "Optimize server response time." },
  STATUS_4XX: { severity: "HIGH" as const, desc: "Page returned a 4xx client error", rec: "Fix or remove links to this URL." },
  STATUS_5XX: { severity: "CRITICAL" as const, desc: "Page returned a 5xx server error", rec: "Investigate and fix the server error." },
  REDIRECT_CHAIN: { severity: "MEDIUM" as const, desc: "Page has redirect chain(s)", rec: "Update links to point directly to the final destination URL." },
  FETCH_ERROR: { severity: "HIGH" as const, desc: "Page could not be fetched", rec: "Check the URL and server availability." },
};

// ─── HTML Analysis ─────────────────────────────────────────────────

export function analyzeHtml(html: string, pageUrl: string): PageAnalysis {
  const $ = cheerio.load(html);

  // Title
  const titleEl = $("title").first();
  const title = titleEl.length ? titleEl.text().trim() : null;
  const titleLength = title ? title.length : 0;

  // Meta description
  const metaDescEl = $('meta[name="description"]').first();
  const metaDescription = metaDescEl.length ? (metaDescEl.attr("content") || "").trim() : null;
  const metaDescLength = metaDescription ? metaDescription.length : 0;

  // Headings
  const h1Elements = $("h1");
  const h1 = h1Elements.length ? h1Elements.first().text().trim() : null;
  const h1Count = h1Elements.length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;

  // Canonical
  const canonicalEl = $('link[rel="canonical"]').first();
  const canonical = canonicalEl.length ? (canonicalEl.attr("href") || "").trim() : null;
  let canonicalIsValid: boolean | null = null;
  if (canonical) {
    try {
      const canonNorm = new URL(canonical, pageUrl).toString();
      canonicalIsValid = canonNorm === pageUrl || canonNorm === new URL(pageUrl).toString();
    } catch {
      canonicalIsValid = false;
    }
  }

  // Robots meta
  const robotsEl = $('meta[name="robots"]').first();
  const robotsMeta = robotsEl.length ? (robotsEl.attr("content") || "").trim().toLowerCase() : null;
  const isNoindex = robotsMeta ? robotsMeta.includes("noindex") : false;
  const isNofollow = robotsMeta ? robotsMeta.includes("nofollow") : false;

  // Word count (visible text)
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  // Images
  const images = $("img");
  const imageCount = images.length;
  let missingAltCount = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null) {
      missingAltCount++;
    }
  });

  // Links
  let internalLinks = 0;
  let externalLinks = 0;
  try {
    const pageHost = new URL(pageUrl).hostname;
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:") || href.startsWith("#")) return;
      try {
        const linkHost = new URL(href, pageUrl).hostname;
        if (linkHost === pageHost || linkHost.endsWith("." + pageHost)) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch { /* skip */ }
    });
  } catch { /* skip */ }

  const isIndexable = !isNoindex;

  return {
    title,
    titleLength,
    metaDescription,
    metaDescLength,
    h1,
    h1Count,
    h2Count,
    h3Count,
    canonical,
    canonicalIsValid,
    robotsMeta,
    isNoindex,
    isNofollow,
    wordCount,
    imageCount,
    missingAltCount,
    internalLinks,
    externalLinks,
    isIndexable,
  };
}

// ─── Issue Detection ───────────────────────────────────────────────

export function detectIssues(
  analysis: PageAnalysis,
  statusCode: number | null,
  responseMs: number,
  htmlSize: number,
  redirectChain: string[],
  fetchError?: string
): SeoIssueRecord[] {
  const issues: SeoIssueRecord[] = [];

  const addIssue = (type: keyof typeof ISSUE_TYPES, extraDesc?: string) => {
    const def = ISSUE_TYPES[type];
    issues.push({
      type,
      severity: def.severity,
      description: extraDesc ? `${def.desc}. ${extraDesc}` : def.desc,
      recommendation: def.rec,
    });
  };

  // Fetch errors
  if (fetchError) {
    addIssue("FETCH_ERROR", fetchError);
    return issues; // No further analysis possible
  }

  // Status code issues
  if (statusCode && statusCode >= 500) {
    addIssue("STATUS_5XX", `HTTP ${statusCode}`);
    return issues;
  }
  if (statusCode && statusCode >= 400) {
    addIssue("STATUS_4XX", `HTTP ${statusCode}`);
    return issues;
  }

  // Redirect chain
  if (redirectChain.length > 0) {
    addIssue("REDIRECT_CHAIN", `${redirectChain.length} redirect(s)`);
  }

  // Title
  if (!analysis.title) {
    addIssue("MISSING_TITLE");
  } else if (analysis.title.length === 0) {
    addIssue("EMPTY_TITLE");
  } else {
    if (analysis.titleLength < SEO_THRESHOLDS.TITLE_MIN_LENGTH) addIssue("TITLE_TOO_SHORT", `${analysis.titleLength} chars`);
    if (analysis.titleLength > SEO_THRESHOLDS.TITLE_MAX_LENGTH) addIssue("TITLE_TOO_LONG", `${analysis.titleLength} chars`);
  }

  // Meta description
  if (analysis.metaDescription === null) {
    addIssue("MISSING_META_DESCRIPTION");
  } else if (analysis.metaDescription.length === 0) {
    addIssue("EMPTY_META_DESCRIPTION");
  } else {
    if (analysis.metaDescLength < SEO_THRESHOLDS.META_DESC_MIN_LENGTH) addIssue("META_DESC_TOO_SHORT", `${analysis.metaDescLength} chars`);
    if (analysis.metaDescLength > SEO_THRESHOLDS.META_DESC_MAX_LENGTH) addIssue("META_DESC_TOO_LONG", `${analysis.metaDescLength} chars`);
  }

  // H1
  if (analysis.h1Count === 0) addIssue("MISSING_H1");
  if (analysis.h1Count > 1) addIssue("MULTIPLE_H1");

  // Canonical
  if (!analysis.canonical) {
    addIssue("MISSING_CANONICAL");
  } else if (analysis.canonicalIsValid === false) {
    addIssue("CANONICAL_MISMATCH");
  }

  // Images
  if (analysis.missingAltCount > 0) {
    addIssue("MISSING_ALT_TEXT", `${analysis.missingAltCount} image(s)`);
  }

  // Noindex
  if (analysis.isNoindex) addIssue("NOINDEX_PAGE");

  // Content
  if (analysis.wordCount < SEO_THRESHOLDS.MIN_WORD_COUNT) addIssue("LOW_WORD_COUNT", `${analysis.wordCount} words`);

  // Performance
  if (htmlSize > SEO_THRESHOLDS.MAX_HTML_SIZE_BYTES) addIssue("LARGE_PAGE", `${(htmlSize / 1024 / 1024).toFixed(1)} MB`);
  if (responseMs > SEO_THRESHOLDS.MAX_RESPONSE_MS) addIssue("SLOW_RESPONSE", `${responseMs}ms`);

  return issues;
}

// ─── SEO Score Calculation ─────────────────────────────────────────
// Score is 0-100. Each page starts at 100 and loses points per issue.
// The overall site score is the average across all crawled pages.
//
// Weights:
//   CRITICAL  → -25 points
//   HIGH      → -15 points
//   MEDIUM    → -8  points
//   LOW       → -3  points
//   INFO      → -0  points

const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0,
};

export function calculatePageScore(issues: SeoIssueRecord[]): number {
  let score = 100;
  for (const issue of issues) {
    score -= SEVERITY_WEIGHTS[issue.severity] || 0;
  }
  return Math.max(0, Math.min(100, score));
}

export function calculateSiteScore(pageScores: number[]): number {
  if (pageScores.length === 0) return 0;
  const sum = pageScores.reduce((a, b) => a + b, 0);
  return Math.round((sum / pageScores.length) * 10) / 10;
}
