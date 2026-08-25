"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, HelpCircle, FileText, CheckCircle2, ChevronLeft, ChevronRight, X, Award } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface Audit {
  id: number;
  propertyId: number;
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
  configuration: string | null;
}

interface PageRecord {
  id: number;
  url: string;
  statusCode: number | null;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescLength: number;
  h1: string | null;
  h1Count: number;
  canonical: string | null;
  canonicalIsValid: boolean | null;
  isNoindex: boolean;
  wordCount: number;
  responseMs: number;
  imageCount: number;
  missingAltCount: number;
  internalLinks: number;
  externalLinks: number;
  depth: number;
  issueCount: number;
}

interface IssueRecord {
  id: number;
  type: string;
  severity: string;
  description: string;
  recommendation: string | null;
  url: string | null;
  pageUrl: string | null;
  pageStatusCode: number | null;
}

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "issues">("overview");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Pages state
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [pagesTotal, setPagesTotal] = useState(0);
  const [pagesPage, setPagesPage] = useState(1);
  const [pagesTotalPages, setPagesTotalPages] = useState(1);
  const [pagesSearch, setPagesSearch] = useState("");
  const [pagesStatusFilter, setPagesStatusFilter] = useState("all");
  const [loadingPages, setLoadingPages] = useState(false);

  // Issues state
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [issuesTotal, setIssuesTotal] = useState(0);
  const [issuesPage, setIssuesPage] = useState(1);
  const [issuesTotalPages, setIssuesTotalPages] = useState(1);
  const [issuesSeverityFilter, setIssuesSeverityFilter] = useState("all");
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Detail Modal state
  const [selectedPage, setSelectedPage] = useState<PageRecord | null>(null);
  const [selectedPageIssues, setSelectedPageIssues] = useState<IssueRecord[]>([]);
  const [loadingPageIssues, setLoadingPageIssues] = useState(false);

  const fetchAuditDetails = async () => {
    try {
      const res = await fetch(`/api/onpage/audits/${auditId}`);
      if (res.ok) {
        const data = await res.json();
        setAudit(data.audit);
      }
    } catch (err) {
      console.error("Failed to load audit details:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchPages = async () => {
    setLoadingPages(true);
    try {
      const q = new URLSearchParams({
        page: pagesPage.toString(),
        limit: "20",
        search: pagesSearch,
      });
      if (pagesStatusFilter !== "all") q.append("status", pagesStatusFilter);

      const res = await fetch(`/api/onpage/audits/${auditId}/pages?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
        setPagesTotal(data.total || 0);
        setPagesTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load pages:", err);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const q = new URLSearchParams({
        page: issuesPage.toString(),
        limit: "20",
      });
      if (issuesSeverityFilter !== "all") q.append("severity", issuesSeverityFilter);

      const res = await fetch(`/api/onpage/audits/${auditId}/issues?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues || []);
        setIssuesTotal(data.total || 0);
        setIssuesTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const openPageDetail = async (page: PageRecord) => {
    setSelectedPage(page);
    setLoadingPageIssues(true);
    try {
      const res = await fetch(`/api/onpage/audits/${auditId}/issues?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.issues || []).filter((i: any) => i.url === page.url);
        setSelectedPageIssues(filtered);
      }
    } catch (err) {
      console.error("Failed to load issues for page:", err);
    } finally {
      setLoadingPageIssues(false);
    }
  };

  useEffect(() => {
    fetchAuditDetails();
  }, [auditId]);

  useEffect(() => {
    if (activeTab === "pages") {
      fetchPages();
    } else if (activeTab === "issues") {
      fetchIssues();
    }
  }, [activeTab, pagesPage, pagesStatusFilter, issuesPage, issuesSeverityFilter]);

  // Handle page search debouncing or simple trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagesPage(1);
    fetchPages();
  };

  if (loadingAudit) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <AlertTriangle size={48} style={{ color: "#DC2626", marginBottom: "16px" }} />
        <h2>Audit Session Not Found</h2>
        <button onClick={() => router.push("/admin/onpage")} className={styles.btnSecondary} style={{ marginTop: "12px" }}>
          Back to Audits List
        </button>
      </div>
    );
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "CRITICAL": return "#DC2626";
      case "HIGH": return "#EA580C";
      case "MEDIUM": return "#D97706";
      case "LOW": return "#2563EB";
      default: return "#4B5563";
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => router.push("/admin/onpage")} style={{ padding: "8px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer" }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Audit Session #{audit.id}</span>
          <h1 style={{ fontSize: "20px", fontWeight: "600", margin: "2px 0 0 0" }}>{audit.domain}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{ padding: "12px 16px", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: activeTab === "overview" ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === "overview" ? "#0D9488" : "#64748B", fontWeight: "600", background: "none", cursor: "pointer", fontSize: "14px" }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("pages")}
          style={{ padding: "12px 16px", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: activeTab === "pages" ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === "pages" ? "#0D9488" : "#64748B", fontWeight: "600", background: "none", cursor: "pointer", fontSize: "14px" }}
        >
          Crawled Pages ({audit.pagesCrawled})
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          style={{ padding: "12px 16px", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: activeTab === "issues" ? "2px solid #0D9488" : "2px solid transparent", color: activeTab === "issues" ? "#0D9488" : "#64748B", fontWeight: "600", background: "none", cursor: "pointer", fontSize: "14px" }}
        >
          Discovered Issues ({audit.issuesCritical + audit.issuesHigh + audit.issuesMedium + audit.issuesLow})
        </button>
      </div>

      {/* ─── TAB CONTENT: OVERVIEW ────────────────────────────────── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Summary Cards */}
          <div style={{ display: "flex", gap: "20px" }}>
            {/* Score Card */}
            <div style={{ flex: 1, background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Overall SEO Score</span>
                <div style={{ fontSize: "36px", fontWeight: "800", marginTop: "8px", color: (audit.score || 0) >= 80 ? "#10B981" : "#EA580C" }}>
                  {audit.score || "Pending"}
                </div>
              </div>
              <Award size={48} style={{ color: (audit.score || 0) >= 80 ? "#10B981" : "#EA580C" }} />
            </div>

            {/* Crawled Info Card */}
            <div style={{ flex: 1, background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Crawl Health</span>
              <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "8px" }}>
                {audit.pagesCrawled} <span style={{ fontSize: "14px", fontWeight: "400", color: "#64748B" }}>crawled</span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94A3B8" }}>
                {audit.pagesDiscovered} total pages discovered on website property.
              </p>
            </div>

            {/* Issues Breakdown */}
            <div style={{ flex: 2, background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Discovered Issues by Severity</span>
              <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                <div style={{ flex: 1, textAlign: "center", background: "#FEF2F2", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#DC2626" }}>{audit.issuesCritical}</div>
                  <div style={{ fontSize: "11px", color: "#7F1D1D", fontWeight: "600" }}>Critical</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#FFF7ED", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#EA580C" }}>{audit.issuesHigh}</div>
                  <div style={{ fontSize: "11px", color: "#7C2D12", fontWeight: "600" }}>High</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#FEF3C7", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#D97706" }}>{audit.issuesMedium}</div>
                  <div style={{ fontSize: "11px", color: "#78350F", fontWeight: "600" }}>Medium</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#EFF6FF", padding: "10px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#2563EB" }}>{audit.issuesLow}</div>
                  <div style={{ fontSize: "11px", color: "#1E3A8A", fontWeight: "600" }}>Low</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Metadata Details */}
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 16px 0", color: "#0F172A" }}>Crawl Summary Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#64748B" }}>Property Domain:</span>
                <strong style={{ display: "block", marginTop: "4px", color: "#0F172A" }}>{audit.domain}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Client Owner:</span>
                <strong style={{ display: "block", marginTop: "4px", color: "#0F172A" }}>{audit.clientName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Status:</span>
                <strong style={{ display: "block", marginTop: "4px", color: "#0F172A" }}>{audit.status}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Start Time:</span>
                <strong style={{ display: "block", marginTop: "4px", color: "#0F172A" }}>
                  {audit.startTime ? new Date(audit.startTime).toLocaleString() : "N/A"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>End Time:</span>
                <strong style={{ display: "block", marginTop: "4px", color: "#0F172A" }}>
                  {audit.endTime ? new Date(audit.endTime).toLocaleString() : "N/A"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748B" }}>Configured Scope:</span>
                <strong style={{ display: "block", marginTop: "4px", color: "#0F172A" }}>
                  {audit.configuration ? JSON.parse(audit.configuration).maxPages + " max pages" : "N/A"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: CRAWLED PAGES ───────────────────────────── */}
      {activeTab === "pages" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Filters Row */}
          <div style={{ display: "flex", gap: "16px", background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "6px 12px", flex: 1 }}>
                <Search size={16} style={{ color: "#94A3B8" }} />
                <input
                  type="text"
                  placeholder="Filter by page URL..."
                  value={pagesSearch}
                  onChange={(e) => setPagesSearch(e.target.value)}
                  style={{ border: "none", outline: "none", fontSize: "13px", width: "100%" }}
                />
              </div>
              <button type="submit" className={styles.btnSecondary}>Search</button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748B" }}>HTTP Status:</span>
              <select
                value={pagesStatusFilter}
                onChange={(e) => { setPagesStatusFilter(e.target.value); setPagesPage(1); }}
                style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px" }}
              >
                <option value="all">All Pages</option>
                <option value="ok">Success (2xx)</option>
                <option value="redirect">Redirects (3xx)</option>
                <option value="error">Errors (4xx/5xx)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loadingPages ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div className="spinner" />
            </div>
          ) : pages.length === 0 ? (
            <div style={{ padding: "40px", background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center", color: "#64748B" }}>
              No matching pages discovered.
            </div>
          ) : (
            <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                    <th style={{ padding: "12px 20px" }}>URL</th>
                    <th style={{ padding: "12px 20px" }}>HTTP</th>
                    <th style={{ padding: "12px 20px" }}>Title</th>
                    <th style={{ padding: "12px 20px" }}>Word Count</th>
                    <th style={{ padding: "12px 20px" }}>Load Speed</th>
                    <th style={{ padding: "12px 20px" }}>Issues</th>
                    <th style={{ padding: "12px 20px" }}>Depth</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openPageDetail(p)}
                      style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "12px 20px", fontWeight: "500", color: "#0F172A", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.url}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{
                          color: (p.statusCode || 0) >= 400 ? "#DC2626" : (p.statusCode || 0) >= 300 ? "#D97706" : "#059669",
                          fontWeight: "700"
                        }}>
                          {p.statusCode || "ERR"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#475569", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.title || <span style={{ color: "#94A3B8" }}>No Title</span>}
                      </td>
                      <td style={{ padding: "12px 20px" }}>{p.wordCount}</td>
                      <td style={{ padding: "12px 20px" }}>{p.responseMs}ms</td>
                      <td style={{ padding: "12px 20px" }}>
                        {p.issueCount > 0 ? (
                          <span style={{ color: "#DC2626", fontWeight: "600" }}>{p.issueCount} issues</span>
                        ) : (
                          <span style={{ color: "#10B981" }}>✓ Clean</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 20px", color: "#64748B" }}>{p.depth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagesTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                  <span style={{ color: "#64748B" }}>Total pages: {pagesTotal}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setPagesPage(prev => Math.max(1, prev - 1))}
                      disabled={pagesPage === 1}
                      style={{ padding: "6px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", opacity: pagesPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: "6px 12px" }}>Page {pagesPage} of {pagesTotalPages}</span>
                    <button
                      onClick={() => setPagesPage(prev => Math.min(pagesTotalPages, prev + 1))}
                      disabled={pagesPage === pagesTotalPages}
                      style={{ padding: "6px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", opacity: pagesPage === pagesTotalPages ? 0.5 : 1 }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: ISSUES ────────────────────────────────── */}
      {activeTab === "issues" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Filters Row */}
          <div style={{ display: "flex", gap: "16px", background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748B" }}>Severity:</span>
              <select
                value={issuesSeverityFilter}
                onChange={(e) => { setIssuesSeverityFilter(e.target.value); setIssuesPage(1); }}
                style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px" }}
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Issues List */}
          {loadingIssues ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div className="spinner" />
            </div>
          ) : issues.length === 0 ? (
            <div style={{ padding: "40px", background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center", color: "#10B981", fontWeight: "600" }}>
              🎉 Perfect! No SEO issues detected on this website.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {issues.map((issue) => (
                <div key={issue.id} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 20px", display: "flex", gap: "16px" }}>
                  <div style={{
                    width: "8px",
                    borderRadius: "4px",
                    background: getSeverityColor(issue.severity),
                    alignSelf: "stretch"
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        background: getSeverityColor(issue.severity) + "15",
                        color: getSeverityColor(issue.severity),
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>{issue.severity}</span>
                      <strong style={{ fontSize: "14px", color: "#0F172A" }}>{issue.type.replace(/_/g, " ")}</strong>
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "13px", color: "#475569" }}>{issue.description}</p>
                    {issue.pageUrl && (
                      <span style={{ fontSize: "12px", color: "#64748B", wordBreak: "break-all" }}>
                        📍 Found on: <code>{issue.pageUrl}</code>
                      </span>
                    )}
                    {issue.recommendation && (
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: "#F8FAFC", borderRadius: "6px", border: "1px solid #F1F5F9", fontSize: "12px", color: "#475569" }}>
                        💡 <strong>Recommendation:</strong> {issue.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {issuesTotalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", border: "1px solid #E2E8F0", background: "white", borderRadius: "8px" }}>
                  <span style={{ color: "#64748B" }}>Total issues: {issuesTotal}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setIssuesPage(prev => Math.max(1, prev - 1))}
                      disabled={issuesPage === 1}
                      style={{ padding: "6px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", opacity: issuesPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: "6px 12px" }}>Page {issuesPage} of {issuesTotalPages}</span>
                    <button
                      onClick={() => setIssuesPage(prev => Math.min(issuesTotalPages, prev + 1))}
                      disabled={issuesPage === issuesTotalPages}
                      style={{ padding: "6px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer", opacity: issuesPage === issuesTotalPages ? 0.5 : 1 }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── PAGE DETAIL MODAL ─────────────────────────────────── */}
      {selectedPage && (
        <div className={modalStyles.overlay} onClick={() => setSelectedPage(null)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title} style={{ fontSize: "15px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Page Technical Details
              </span>
              <button onClick={() => setSelectedPage(null)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div className={modalStyles.body} style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "70vh", overflowY: "auto", fontSize: "13px" }}>
              {/* URL card */}
              <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", fontSize: "11px" }}>URL</span>
                <strong style={{ display: "block", fontSize: "13px", wordBreak: "break-all", color: "#0F172A", marginTop: "2px" }}>{selectedPage.url}</strong>
              </div>

              {/* Grid properties */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div style={{ background: "white", border: "1px solid #F1F5F9", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>Status Code</span>
                  <strong style={{ display: "block", color: (selectedPage.statusCode || 0) >= 400 ? "#DC2626" : "#059669", marginTop: "2px" }}>{selectedPage.statusCode || "N/A"}</strong>
                </div>
                <div style={{ background: "white", border: "1px solid #F1F5F9", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>Response Speed</span>
                  <strong style={{ display: "block", marginTop: "2px" }}>{selectedPage.responseMs}ms</strong>
                </div>
                <div style={{ background: "white", border: "1px solid #F1F5F9", padding: "10px", borderRadius: "6px" }}>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>Word Count</span>
                  <strong style={{ display: "block", marginTop: "2px" }}>{selectedPage.wordCount}</strong>
                </div>
              </div>

              {/* Tags details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>Title Tag ({selectedPage.titleLength} chars)</span>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "600", color: selectedPage.title ? "#0F172A" : "#94A3B8" }}>
                    {selectedPage.title || "No title tag detected"}
                  </p>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>Meta Description ({selectedPage.metaDescLength} chars)</span>
                  <p style={{ margin: "2px 0 0 0", color: selectedPage.metaDescription ? "#475569" : "#94A3B8" }}>
                    {selectedPage.metaDescription || "No meta description tag detected"}
                  </p>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>H1 Tag</span>
                  <p style={{ margin: "2px 0 0 0", fontWeight: "600", color: selectedPage.h1 ? "#0F172A" : "#94A3B8" }}>
                    {selectedPage.h1 || "No H1 detected"} (Count: {selectedPage.h1Count})
                  </p>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "11px" }}>Canonical Tag</span>
                  <p style={{ margin: "2px 0 0 0", color: selectedPage.canonical ? "#475569" : "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
                    {selectedPage.canonical || "No canonical detected"}
                    {selectedPage.canonical && (
                      <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "10px", background: selectedPage.canonicalIsValid ? "#DCFCE7" : "#FEE2E2", color: selectedPage.canonicalIsValid ? "#16A34A" : "#EF4444" }}>
                        {selectedPage.canonicalIsValid ? "Valid" : "Mismatch/Invalid"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Issues detected on page */}
              <div style={{ marginTop: "10px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "600", margin: "0 0 10px 0", color: "#0F172A" }}>Issues Detected on This Page</h4>
                {loadingPageIssues ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}><div className="spinner" /></div>
                ) : selectedPageIssues.length === 0 ? (
                  <div style={{ padding: "10px", background: "#DCFCE7", color: "#16A34A", borderRadius: "6px", fontWeight: "600" }}>
                    ✓ Perfect! No SEO issues found on this page.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedPageIssues.map((issue) => (
                      <div key={issue.id} style={{ background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: "6px", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: getSeverityColor(issue.severity), fontSize: "10px", fontWeight: "800" }}>[{issue.severity}]</span>
                          <strong style={{ color: "#7C2D12" }}>{issue.type.replace(/_/g, " ")}</strong>
                        </div>
                        <p style={{ margin: "2px 0 0 0", color: "#9A3412" }}>{issue.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={modalStyles.footer}>
              <button onClick={() => setSelectedPage(null)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`}>
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
