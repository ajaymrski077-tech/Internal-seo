"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Calendar, 
  CheckCircle,
  FileText,
  AlertTriangle,
  Link as LinkIcon,
  Globe
} from "lucide-react";
import styles from "@/styles/Share.module.css";
import { ClientDashboardCard } from "@/services/dashboardService";

export default function ShareDashboardPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [range, setRange] = useState("30d");
  const [data, setData] = useState<ClientDashboardCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSharedData() {
      if (!shareToken) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/share/${shareToken}?range=${range}`);
        if (!res.ok) {
          const errPayload = await res.json();
          throw new Error(errPayload.error || "Failed to load dashboard data");
        }
        const payload = await res.json();
        setData(payload);
      } catch (err: any) {
        console.error("Shared dashboard load error:", err);
        setError(err.message || "Failed to retrieve reporting dashboard. The link may have expired or access was revoked.");
      } finally {
        setLoading(false);
      }
    }
    fetchSharedData();
  }, [shareToken, range]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p style={{ color: "var(--text-secondary)" }}>Securing channel and pulling metrics data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle size={48} style={{ color: "var(--error)" }} />
        <h2 style={{ color: "var(--text-primary)", fontWeight: "700" }}>Access Denied or Link Expired</h2>
        <p className={styles.errorText} style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto", fontSize: "0.9rem", lineHeight: "1.4" }}>
          {error || "We could not verify your access token. Please ask your account manager for a fresh share link."}
        </p>
      </div>
    );
  }

  // Format Helper for Change Delta
  const renderTrend = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`${styles.trendBadge} ${isPositive ? styles.positive : styles.negative}`}>
        {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {isPositive ? "+" : ""}{value.toFixed(1)}%
      </span>
    );
  };

  // SVG Trend Line Chart Variables
  const currentHistory = data.history?.current || [];
  const maxVal = Math.max(...currentHistory.map(h => Math.max(h.sessions, h.organicTraffic)), 100);
  const minVal = 0;
  const paddingY = 20;
  const chartHeight = 220;

  // Chart Rendering coordinate mapper
  const getCoordinates = (type: "sessions" | "organicTraffic") => {
    if (currentHistory.length < 2) return "";
    const width = 1100; // estimated width
    const stepX = width / (currentHistory.length - 1);
    
    return currentHistory.map((pt, idx) => {
      const val = type === "sessions" ? pt.sessions : pt.organicTraffic;
      const x = idx * stepX;
      const y = chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
      return `${x},${y}`;
    }).join(" ");
  };

  const sessionsPoints = getCoordinates("sessions");
  const trafficPoints = getCoordinates("organicTraffic");

  return (
    <div className={styles.container}>
      {/* Portal Top Bar */}
      <header className={styles.portalHeader}>
        <div className={styles.logoArea} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="MisterSK Infotech" style={{ height: "24px", width: "auto" }} />
          <span style={{ fontSize: "0.75rem", opacity: 0.4, fontWeight: "normal" }}>|</span>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>
            Client Reporting Portal
          </span>
        </div>
        <div className={styles.statusIndicator}>
          <CheckCircle size={14} style={{ color: "var(--success)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Read-Only Secure Connection</span>
        </div>
      </header>

      {/* Client Overview Card */}
      <div className={styles.clientHeader}>
        <div className={styles.clientInfo}>
          <h1 className={styles.clientName}>{data.name}</h1>
          <a 
            href={`https://${data.domain}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.clientDomain}
          >
            <Globe size={14} />
            {data.domain}
            <ExternalLink size={12} style={{ opacity: 0.5 }} />
          </a>
        </div>

        {/* Date Filters controls */}
        <div className={styles.controlsRow}>
          <div className={styles.dateFilters}>
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`${styles.filterBtn} ${range === r ? styles.filterBtnActive : ""}`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {/* Sessions KPI Card */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Organic Sessions (GA4)</div>
          <div className={styles.kpiValue}>
            {data.metrics?.sessions.toLocaleString() || 0}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            {renderTrend(data.metrics?.sessionsChange || 0)}
            <span className={styles.trendPeriod}>vs previous period</span>
          </div>
        </div>

        {/* Organic Clicks KPI Card */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Search Clicks (GSC)</div>
          <div className={styles.kpiValue}>
            {data.metrics?.organicTraffic.toLocaleString() || 0}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            {renderTrend(data.metrics?.organicTrafficChange || 0)}
            <span className={styles.trendPeriod}>vs previous period</span>
          </div>
        </div>

        {/* Conversions KPI Card */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Goal Conversions (GA4)</div>
          <div className={styles.kpiValue}>
            {data.metrics?.conversions.toLocaleString() || 0}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            {renderTrend(data.metrics?.conversionsChange || 0)}
            <span className={styles.trendPeriod}>vs previous period</span>
          </div>
        </div>
      </div>

      {/* Analytics Trend Chart */}
      <div className={styles.chartsCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Historical Performance Trend</h3>
          <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "3px", background: "var(--accent-color)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Organic Sessions</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "3px", background: "var(--success)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Search Clicks</span>
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          {currentHistory.length >= 2 ? (
            <svg className={styles.chartSvg} viewBox={`0 0 1100 ${chartHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={paddingY} x2="1100" y2={paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1={chartHeight / 2} x2="1100" y2={chartHeight / 2} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1={chartHeight - paddingY} x2="1100" y2={chartHeight - paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />

              {/* Fill Areas */}
              {sessionsPoints && (
                <path
                  d={`M 0,${chartHeight - paddingY} L ${sessionsPoints} L 1100,${chartHeight - paddingY} Z`}
                  fill="url(#sessionsGrad)"
                />
              )}
              {trafficPoints && (
                <path
                  d={`M 0,${chartHeight - paddingY} L ${trafficPoints} L 1100,${chartHeight - paddingY} Z`}
                  fill="url(#clicksGrad)"
                />
              )}

              {/* Trend Lines */}
              {sessionsPoints && (
                <polyline
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="2.5"
                  points={sessionsPoints}
                />
              )}
              {trafficPoints && (
                <polyline
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  points={trafficPoints}
                />
              )}
            </svg>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", height: "100%", width: "100%", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Insufficient history logs in database to plot timeline trends.
            </div>
          )}
        </div>
      </div>

      {/* Client Deliveries List */}
      <div className={styles.deliveriesCard}>
        <h3 className={styles.chartTitle}>Recent SEO Campaign Deliveries</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "-8px" }}>
          Verified deliverables and operational tasks completed during the active report range.
        </p>

        {data.deliveries && data.deliveries.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Delivery Date</th>
                  <th>Task Type</th>
                  <th>Description</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.deliveries.map((item) => {
                  const dateStr = new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                          <Calendar size={13} />
                          {dateStr}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.deliveryType} ${styles[item.type.toLowerCase()]}`}>
                          {item.type === "BACKLINK" ? (
                            <>
                              <LinkIcon size={10} style={{ marginRight: "4px" }} />
                              Backlink
                            </>
                          ) : (
                            <>
                              <FileText size={10} style={{ marginRight: "4px" }} />
                              Content
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-primary)", fontWeight: "500" }}>{item.description}</td>
                      <td>
                        {item.type === "BACKLINK" && item.linkDetails && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <a 
                              href={item.linkDetails.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: "var(--accent-color)", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                            >
                              {item.linkDetails.url.replace(/^(https?:\/\/)?(www\.)?/, "").slice(0, 30)}...
                              <ExternalLink size={10} />
                            </a>
                            {item.linkDetails.domainAuthority && <span> (DA: {item.linkDetails.domainAuthority})</span>}
                          </div>
                        )}
                        {item.type === "CONTENT" && item.contentDetails && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {item.contentDetails.url ? (
                              <a 
                                href={item.contentDetails.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: "var(--accent-color)", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                              >
                                {item.contentDetails.title || "View Article"}
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span>{item.contentDetails.title}</span>
                            )}
                            {item.contentDetails.wordCount && <span> ({item.contentDetails.wordCount} words)</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No verified SEO tasks or content deliveries completed in this date range.
          </div>
        )}
      </div>

      <footer style={{ marginTop: "40px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
        © {new Date().getFullYear()} MisterSK Infotech. Registered Client Reporting Console.
      </footer>
    </div>
  );
}
