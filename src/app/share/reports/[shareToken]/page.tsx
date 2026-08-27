"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Printer,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  MessageSquare,
  BarChart2,
  AlertCircle,
  RefreshCw,
  Send
} from "lucide-react";
import styles from "@/styles/Reports.module.css";

interface SnapshotMetrics {
  sessions?: number;
  organicTraffic?: number;
  conversions?: number;
  sessionsChange?: number;
  organicTrafficChange?: number;
  conversionsChange?: number;
}

interface SnapshotHistoryPoint {
  date: string;
  sessions?: number;
  organicTraffic?: number;
  conversions?: number;
}

interface SnapshotDelivery {
  id: string | number;
  type: string; // BACKLINK, CONTENT
  date: string;
  description: string;
  linkDetails?: {
    url?: string;
    targetUrl?: string;
    domainAuthority?: number;
    anchorText?: string;
  };
  contentDetails?: {
    title: string;
    url?: string;
    wordCount?: number;
  };
}

interface SharedReportData {
  id: string;
  clientId: string;
  name: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  comparisonRange: string;
  status: string;
  summary?: string | null;
  nextMonthPlans?: string | null;
  shareToken: string | null;
  createdAt: string;
  client: {
    id?: string;
    name: string;
    companyName: string | null;
    logoUrl: string | null;
  };
  property: {
    domain: string;
    name: string;
  } | null;
  snapshots: Array<{
    id: string;
    metricsJson: string;
    historyJson: string;
    deliveriesJson: string;
    generatedAt: string;
  }>;
  previousReports?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    shareToken: string | null;
  }>;
}

export default function SharedReportPage() {
  const rawParams = useParams();
  const shareToken = (rawParams?.shareToken as string) || "";
  const reportId = (rawParams?.reportId as string) || "";

  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "channels">("overview");

  // Interactive hover state
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [comments, setComments] = useState<Array<{ name: string; text: string; date: string }>>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = shareToken 
        ? `/api/share/reports/${shareToken}`
        : `/api/reports/${reportId}`;
      
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("Report not found or has been archived.");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [shareToken, reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      {
        name: commentAuthor.trim() || "Anonymous",
        text: commentText.trim(),
        date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      }
    ]);
    setCommentText("");
    setCommentAuthor("");
  };

  if (loading && !report) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <RefreshCw className={styles.spinner} size={36} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: "600px", margin: "100px auto", textAlign: "center", background: "#FFFFFF", padding: "40px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
        <AlertCircle size={40} style={{ color: "#EF4444", margin: "0 auto 12px auto" }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0F172A" }}>Report Unavailable</h2>
        <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "8px 0 20px 0" }}>
          {error || "This report does not exist or has expired."}
        </p>
      </div>
    );
  }

  // Parse Snapshot
  let metrics: SnapshotMetrics = {};
  let currentHistory: SnapshotHistoryPoint[] = [];
  let deliveries: SnapshotDelivery[] = [];

  if (report.snapshots && report.snapshots[0]) {
    try {
      metrics = JSON.parse(report.snapshots[0].metricsJson || "{}");
    } catch {}
    try {
      const hist = JSON.parse(report.snapshots[0].historyJson || "{}");
      currentHistory = hist.current || [];
    } catch {}
    try {
      deliveries = JSON.parse(report.snapshots[0].deliveriesJson || "[]");
    } catch {}
  }

  const backlinks = deliveries.filter((d) => d.type === "BACKLINK");
  const contents = deliveries.filter((d) => d.type === "CONTENT");

  const startDateFormatted = new Date(report.startDate).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
  const endDateFormatted = new Date(report.endDate).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");

  // Chart plotting logic
  const renderChart = () => {
    if (currentHistory.length < 2) {
      return (
        <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "0.875rem" }}>
          No daily performance data available for this range.
        </div>
      );
    }

    const totalVals = currentHistory.map((h) => h.sessions || 0);
    const orgVals = currentHistory.map((h) => h.organicTraffic || 0);
    const rawMax = Math.max(...totalVals, ...orgVals, 0);
    const maxVal = rawMax > 0 ? Math.ceil(rawMax * 1.3) : 10;
    const minVal = 0;

    const width = 800;
    const height = 240;
    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const stepX = plotW / (currentHistory.length - 1);

    const getY = (val: number) => {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      return padT + plotH - ((clamped - minVal) / (maxVal - minVal)) * plotH;
    };

    const getX = (idx: number) => padL + idx * stepX;

    // Spline path
    const getSpline = (vals: number[]) => {
      const pts = vals.map((v, i) => ({ x: getX(i), y: getY(v) }));
      if (pts.length <= 1) return "";
      let path = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      return path;
    };

    const linePath1 = getSpline(totalVals);
    const linePath2 = getSpline(orgVals);

    return (
      <div style={{ position: "relative", width: "100%", height: `${height}px`, userSelect: "none" }} onMouseLeave={() => setHoveredIdx(null)}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "100%" }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const nearest = Math.round((mouseX - padL) / stepX);
            if (nearest >= 0 && nearest < currentHistory.length) {
              setHoveredIdx(nearest);
            }
          }}
        >
          {/* Y Axis Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = padT + plotH * pct;
            const v = Math.round(maxVal * (1 - pct));
            return (
              <g key={i}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{v}</text>
              </g>
            );
          })}

          {/* Curves */}
          <path d={linePath1} fill="none" stroke="#0F4C5C" strokeWidth="2.5" />
          <path d={linePath2} fill="none" stroke="#2563EB" strokeWidth="2" />

          {/* Delivery markers */}
          {currentHistory.map((h, i) => {
            const hDate = h.date.split("T")[0];
            const matchDeliveries = deliveries.filter((d) => d.date.split("T")[0] === hDate);
            if (matchDeliveries.length === 0) return null;
            const x = getX(i);
            const y = getY(h.sessions || 0);

            return matchDeliveries.map((del, dIdx) => (
              <polygon
                key={`${i}-${dIdx}`}
                points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`}
                fill={del.type === "BACKLINK" ? "#F97316" : "#8B5CF6"}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            ));
          })}

          {/* Hover indicator */}
          {hoveredIdx !== null && (
            <g>
              <line x1={getX(hoveredIdx)} y1={padT} x2={getX(hoveredIdx)} y2={padT + plotH} stroke="#64748B" strokeDasharray="3 3" />
              <circle cx={getX(hoveredIdx)} cy={getY(currentHistory[hoveredIdx]?.sessions || 0)} r="4" fill="#0F4C5C" stroke="#FFF" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hoveredIdx !== null && currentHistory[hoveredIdx] && (
          <div
            style={{
              position: "absolute",
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: "10px",
              transform: "translateX(-50%)",
              background: "#0F172A",
              color: "#FFF",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "0.75rem",
              zIndex: 10,
              pointerEvents: "none"
            }}
          >
            <div>{new Date(currentHistory[hoveredIdx].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
            <div style={{ color: "#38BDF8" }}>Sessions: {currentHistory[hoveredIdx].sessions || 0}</div>
            <div style={{ color: "#60A5FA" }}>Organic: {currentHistory[hoveredIdx].organicTraffic || 0}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px 0 60px 0" }}>
      <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "0 20px" }}>
        
        {/* 1. TOP BRAND & PRINT BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="Mister SK Infotech" style={{ height: "32px", width: "auto" }} />
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0F172A", letterSpacing: "-0.5px" }}>
                Mister SK Infotech
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Monthly SEO Report
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={() => window.print()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#0F172A",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* 2. REPORT TITLE & ACTION BUTTONS */}
        <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            {report.client.name} — Monthly Report (GA4)
          </h1>
          <div style={{ fontSize: "0.875rem", color: "#64748B", marginBottom: "16px" }}>
            {startDateFormatted} to {endDateFormatted}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/admin/rankings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                background: "#0F4C5C",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              <BarChart2 size={14} />
              View Rankings
            </Link>
            <Link
              href="/admin/tickets"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#0F172A",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              <MessageSquare size={14} />
              Support Tickets
            </Link>
          </div>
        </div>

        {/* 3. SUB TABS */}
        <div style={{ display: "flex", gap: "20px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "8px 4px 12px 4px",
              fontSize: "0.9375rem",
              fontWeight: activeTab === "overview" ? "700" : "500",
              color: activeTab === "overview" ? "#0F4C5C" : "#64748B",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "overview" ? "2px solid #0F4C5C" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            style={{
              padding: "8px 4px 12px 4px",
              fontSize: "0.9375rem",
              fontWeight: activeTab === "channels" ? "700" : "500",
              color: activeTab === "channels" ? "#0F4C5C" : "#64748B",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "channels" ? "2px solid #0F4C5C" : "2px solid transparent",
              cursor: "pointer"
            }}
          >
            Channels
          </button>
        </div>

        {/* 4. MAIN 2-COLUMN LAYOUT (Content on Left, Sidebar on Right) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* TRAFFIC PERFORMANCE CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>Traffic Performance</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Google Analytics 4 • {startDateFormatted} to {endDateFormatted}</span>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "#475569", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: 8, height: 8, transform: "rotate(45deg)", background: "#F97316" }} />
                  <span>Backlink placed</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6" }} />
                  <span>Content published</span>
                </div>
              </div>

              {/* Chart */}
              {renderChart()}

              {/* 3 Metric Boxes Below Chart */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #F1F5F9" }}>
                <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>Sessions</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0F172A", margin: "4px 0" }}>
                    {(metrics.sessions ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "600", color: (metrics.sessionsChange ?? 0) >= 0 ? "#16A34A" : "#DC2626" }}>
                    {(metrics.sessionsChange ?? 0) >= 0 ? "+" : ""}{(metrics.sessionsChange ?? 0).toFixed(1)}%
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>Organic Sessions</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0F172A", margin: "4px 0" }}>
                    {(metrics.organicTraffic ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "600", color: (metrics.organicTrafficChange ?? 0) >= 0 ? "#16A34A" : "#DC2626" }}>
                    {(metrics.organicTrafficChange ?? 0) >= 0 ? "+" : ""}{(metrics.organicTrafficChange ?? 0).toFixed(1)}%
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>Conversion Data Pulled from GA4</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0F172A", margin: "4px 0" }}>
                    {metrics.conversions ?? 0}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Conversions</div>
                </div>
              </div>
            </div>

            {/* AI REFERRAL TRAFFIC CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0F172A" }}>AI Referral Traffic</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Compare to previous period</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "#475569" }}>Total AI Traffic</span>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>0 <span style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: "600" }}>▲ +0%</span></span>
              </div>
            </div>

            {/* SUMMARY & NOTES CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A", margin: "0 0 14px 0" }}>Summary & Notes</h3>
              <div style={{ fontSize: "0.875rem", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-line" }}>
                {report.summary || `Hi ${report.client.name},\n\nThis month has seen steady performance. Visibility and engagement have progressed across targeted keywords, and core service pages continue to gain topical relevance.\n\nWe will continue to focus on link building and page optimization in the coming cycle.`}
              </div>
            </div>

            {/* NEXT MONTH PLANS CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A", margin: "0 0 14px 0" }}>Next Month Plans</h3>
              <div style={{ fontSize: "0.875rem", lineHeight: "1.6", color: "#334155", whiteSpace: "pre-line" }}>
                {report.nextMonthPlans || `1. Continued supporting content creation and publishing.\n2. Tracking keyword positions to identify optimization targets.\n3. Building high-authority backlinks.`}
              </div>
            </div>

            {/* BACKLINKS TABLE CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>Backlinks</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{backlinks.length} {backlinks.length === 1 ? "link" : "links"}</span>
              </div>

              {backlinks.length === 0 ? (
                <div style={{ fontSize: "0.875rem", color: "#64748B", padding: "12px 0" }}>
                  No backlinks logged for this reporting period.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8125rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                      <th style={{ padding: "8px 0", fontWeight: "600" }}>Source</th>
                      <th style={{ padding: "8px 12px", fontWeight: "600" }}>Target</th>
                      <th style={{ padding: "8px 0", fontWeight: "600", textAlign: "right" }}>DA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backlinks.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px 0", color: "#0F172A", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {b.linkDetails?.url || b.description}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#64748B", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {b.linkDetails?.targetUrl || report.property?.domain || "—"}
                        </td>
                        <td style={{ padding: "10px 0", textAlign: "right" }}>
                          <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#10B981", color: "#FFF", fontWeight: "700", fontSize: "0.75rem" }}>
                            {b.linkDetails?.domainAuthority || 35}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* CONTENT PUBLISHED CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>Content Published</span>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{contents.length} {contents.length === 1 ? "piece" : "pieces"}</span>
              </div>

              {contents.length === 0 ? (
                <div style={{ fontSize: "0.875rem", color: "#64748B", padding: "12px 0" }}>
                  No content deliverables logged for this reporting period.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8125rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                      <th style={{ padding: "8px 0", fontWeight: "600" }}>Title</th>
                      <th style={{ padding: "8px 12px", fontWeight: "600" }}>Type</th>
                      <th style={{ padding: "8px 0", fontWeight: "600", textAlign: "right" }}>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contents.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px 0", color: "#0F172A", fontWeight: "500" }}>
                          {c.contentDetails?.title || c.description}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#64748B" }}>
                          Blog Post
                        </td>
                        <td style={{ padding: "10px 0", textAlign: "right", color: "#94A3B8" }}>
                          {new Date(c.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* COMMENTS CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>Comments</h3>
              
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.875rem", padding: "12px 0 20px 0" }}>
                  No comments yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {comments.map((c, idx) => (
                    <div key={idx} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{c.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{c.date}</span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "#475569", margin: 0 }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handlePostComment} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none", resize: "vertical" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    style={{ width: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", outline: "none" }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 18px",
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      background: "#0F4C5C",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (SIDEBAR) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* PREVIOUS REPORTS CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
                Previous Reports
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {report.previousReports && report.previousReports.length > 0 ? (
                  report.previousReports.map((pr) => {
                    const isCurrent = pr.id === report.id;
                    const prTitle = new Date(pr.startDate).toLocaleDateString(undefined, { month: "long", year: "numeric" });
                    const prDates = `${new Date(pr.startDate).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")} to ${new Date(pr.endDate).toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")}`;
                    const targetUrl = pr.shareToken ? `/share/reports/${pr.shareToken}` : `/admin/reports/view/${pr.id}`;

                    return (
                      <Link
                        key={pr.id}
                        href={targetUrl}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: isCurrent ? "#0F4C5C" : "transparent",
                          color: isCurrent ? "#FFFFFF" : "#0F172A",
                          textDecoration: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          transition: "background 0.15s ease"
                        }}
                      >
                        <strong style={{ fontSize: "0.875rem" }}>{prTitle}</strong>
                        <span style={{ fontSize: "0.725rem", color: isCurrent ? "rgba(255,255,255,0.75)" : "#94A3B8" }}>
                          {prDates}
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>
                    No other reports available.
                  </div>
                )}
              </div>
            </div>

            {/* NEED SOMETHING / SUPPORT CARD */}
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <MessageSquare size={28} style={{ color: "#0F4C5C", margin: "0 auto 8px auto" }} />
              <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                Need Something?
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0 0 14px 0", lineHeight: "1.4" }}>
                Submit a request or check the status of existing tickets.
              </p>
              <Link
                href="/admin/tickets"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#FFFFFF",
                  background: "#0F4C5C",
                  borderRadius: "6px",
                  textDecoration: "none"
                }}
              >
                Open Support Tickets
              </Link>
            </div>
          </div>
        </div>

        {/* 5. FOOTER */}
        <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #E2E8F0", fontSize: "0.75rem", color: "#94A3B8" }}>
          <div>Generated by <strong>Mister SK Infotech</strong></div>
          <div style={{ marginTop: "2px" }}>Report created on {new Date(report.createdAt).toLocaleDateString()}</div>
        </div>

      </div>
    </div>
  );
}
