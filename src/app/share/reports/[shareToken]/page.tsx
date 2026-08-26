"use client";

import { useState, useEffect, useCallback, use } from "react";
import { 
  Calendar, 
  ExternalLink,
  AlertCircle,
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import styles from "@/styles/Reports.module.css";

interface PropertyDetail {
  id: number;
  domain: string;
  name: string;
}

interface ClientDetail {
  name: string;
  companyName: string | null;
  logoUrl: string | null;
}

interface SharedReportData {
  id: number;
  name: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  comparisonRange: string;
  status: string;
  sections: string; // JSON array
  createdAt: string;
  client: ClientDetail;
  property: PropertyDetail | null;
  snapshots: Array<{
    id: number;
    metricsJson: string;
    historyJson: string;
    deliveriesJson: string;
    generatedAt: string;
  }>;
}

interface HistoryPoint {
  date: string;
  sessions?: number;
  organicTraffic?: number;
  conversions?: number;
}

interface SnapshotMetrics {
  sessions?: number;
  organicTraffic?: number;
  conversions?: number;
  sessionsChange?: number;
  organicTrafficChange?: number;
  conversionsChange?: number;
}

interface SnapshotDelivery {
  id: string | number;
  type: string;
  date: string;
  description: string;
  linkDetails?: { url?: string; targetUrl?: string; domainAuthority?: number };
  contentDetails?: { title: string; url?: string; wordCount?: number };
}

export default function SharedReportPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);

  // States
  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSharedReport = useCallback(async () => {
    if (!shareToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/share/reports/${shareToken}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Report not found or has been archived.");
        }
        throw new Error("Failed to load client report.");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      const errObj = err as Error;
      setError(errObj?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchSharedReport();
  }, [fetchSharedReport]);

  if (loading && !report) {
    return (
      <div className={styles.loaderArea} style={{ padding: "120px" }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard} style={{ margin: "40px auto", maxWidth: "480px" }}>
          <AlertCircle size={36} style={{ color: "var(--error)" }} />
          <h3>Report Load Error</h3>
          <p>{error || "The requested shared report does not exist or has been revoked."}</p>
        </div>
      </div>
    );
  }

  const hasSnapshot = report.snapshots && report.snapshots.length > 0;
  const snapshot = hasSnapshot ? report.snapshots[0] : null;

  let metricsData: SnapshotMetrics | null = null;
  let historyData: { current?: HistoryPoint[]; previous?: HistoryPoint[] } | null = null;
  let deliveriesData: SnapshotDelivery[] = [];
  let sectionsList: string[] = [];

  try {
    sectionsList = JSON.parse(report.sections || "[]");
    if (snapshot) {
      metricsData = JSON.parse(snapshot.metricsJson || "{}");
      historyData = JSON.parse(snapshot.historyJson || "{}");
      deliveriesData = JSON.parse(snapshot.deliveriesJson || "[]");
    }
  } catch (err) {
    console.error("Failed to parse report snapshot:", err);
  }

  const getPeriodLabel = () => {
    const start = new Date(report.startDate);
    const end = new Date(report.endDate);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Render SVG timeline chart
  const renderTrendSVG = (metricKey: "sessions" | "organicTraffic" | "conversions") => {
    const currentTimeline = historyData?.current || [];
    const prevTimeline = historyData?.previous || [];

    if (currentTimeline.length < 2) {
      return (
        <div className={styles.noChartData}>
          Not enough timeline data points to draw.
        </div>
      );
    }

    const currentValues = currentTimeline.map((h) => h[metricKey] || 0);
    const prevValues = prevTimeline.map((h) => h[metricKey] || 0);
    const maxVal = Math.max(...currentValues, ...prevValues, 100);
    const minVal = 0;
    
    const chartHeight = 180;
    const width = 800;
    const paddingY = 15;
    const stepX = width / (currentTimeline.length - 1);

    const getPointsStr = (dataset: HistoryPoint[]) => {
      return dataset.map((pt, idx) => {
        const val = pt[metricKey] || 0;
        const x = idx * stepX;
        const y = chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
        return `${x},${y}`;
      }).join(" ");
    };

    const currentPoints = getPointsStr(currentTimeline);
    const prevPoints = prevTimeline.length >= 2 ? getPointsStr(prevTimeline) : "";

    return (
      <div className={styles.chartContainer} style={{ height: "180px" }}>
        <svg viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id={`grad-shared-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight / 2} x2={width} y2={chartHeight / 2} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight - paddingY} x2={width} y2={chartHeight - paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />

          {prevPoints && (
            <polyline fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="3 3" points={prevPoints} opacity="0.5" />
          )}
          {currentPoints && (
            <path d={`M 0,${chartHeight - paddingY} L ${currentPoints} L ${width},${chartHeight - paddingY} Z`} fill={`url(#grad-shared-${metricKey})`} />
          )}
          {currentPoints && (
            <polyline fill="none" stroke="var(--accent-color)" strokeWidth="2" points={currentPoints} />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.container} style={{ maxWidth: "1100px", margin: "40px auto" }}>
      {/* Header Panel */}
      <div className={styles.card}>
        <div className={styles.reportHeaderMain}>
          <div>
            <h1 className={styles.reportTitleText} style={{ fontSize: "1.8rem" }}>{report.name}</h1>
            <p className={styles.reportSubtitleText}>
              Client Report for: <strong>{report.client.companyName || report.client.name}</strong> 
              {report.property && (
                <> • Domain: <strong>{report.property.domain}</strong></>
              )}
            </p>
            <span className={styles.generatedTimestamp}>
              Period: {getPeriodLabel()} 
              {snapshot && ` | Generated: ${new Date(snapshot.generatedAt).toLocaleDateString()}`}
            </span>
          </div>

          <div className="no-print">
            <button onClick={() => window.print()} className={styles.btnActionPrimary} style={{ background: "var(--accent-color)" }}>
              <Download size={14} style={{ marginRight: "6px" }} />
              Download Report PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stored Snapshots Display */}
      {snapshot ? (
        <div className={styles.reportSnapshotGrid}>
          
          {/* 1. EXECUTIVE SUMMARY SECTION */}
          {sectionsList.includes("overview") && metricsData && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Executive Metrics Summary</h2>
              <div className={styles.summaryGrid}>
                {/* Organic Sessions */}
                <div className={styles.summaryItemCard}>
                  <span className={styles.summaryLabel}>Organic Sessions (GA4)</span>
                  <span className={styles.summaryValue}>{metricsData.sessions?.toLocaleString() || 0}</span>
                  {report.comparisonRange !== "NONE" && (
                    <div className={styles.summaryDeltaRow}>
                      <span className={`${styles.deltaBadge} ${(metricsData.sessionsChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                        {(metricsData.sessionsChange ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {(metricsData.sessionsChange ?? 0) >= 0 ? "+" : ""}{metricsData.sessionsChange ?? 0}%
                      </span>
                      <span className={styles.deltaLabel}>vs comparison period</span>
                    </div>
                  )}
                </div>

                {/* Search Clicks */}
                <div className={styles.summaryItemCard}>
                  <span className={styles.summaryLabel}>Search Clicks (GSC)</span>
                  <span className={styles.summaryValue}>{metricsData.organicTraffic?.toLocaleString() || 0}</span>
                  {report.comparisonRange !== "NONE" && (
                    <div className={styles.summaryDeltaRow}>
                      <span className={`${styles.deltaBadge} ${(metricsData.organicTrafficChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                        {(metricsData.organicTrafficChange ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {(metricsData.organicTrafficChange ?? 0) >= 0 ? "+" : ""}{metricsData.organicTrafficChange ?? 0}%
                      </span>
                      <span className={styles.deltaLabel}>vs comparison period</span>
                    </div>
                  )}
                </div>

                {/* Conversions */}
                <div className={styles.summaryItemCard}>
                  <span className={styles.summaryLabel}>Goal Conversions (GA4)</span>
                  <span className={styles.summaryValue}>{metricsData.conversions?.toLocaleString() || 0}</span>
                  {report.comparisonRange !== "NONE" && (
                    <div className={styles.summaryDeltaRow}>
                      <span className={`${styles.deltaBadge} ${(metricsData.conversionsChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                        {(metricsData.conversionsChange ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {(metricsData.conversionsChange ?? 0) >= 0 ? "+" : ""}{metricsData.conversionsChange ?? 0}%
                      </span>
                      <span className={styles.deltaLabel}>vs comparison period</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. ORGANIC SESSIONS */}
          {sectionsList.includes("sessions") && historyData && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>Organic Sessions Over Time (GA4)</h2>
              {renderTrendSVG("sessions")}
            </div>
          )}

          {/* 3. GSC PERFORMANCE */}
          {sectionsList.includes("organic") && historyData && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>Google Search Console Clicks</h2>
              {renderTrendSVG("organicTraffic")}
            </div>
          )}

          {/* 4. CONVERSIONS */}
          {sectionsList.includes("conversions") && historyData && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>Goal Conversions (GA4)</h2>
              {renderTrendSVG("conversions")}
            </div>
          )}

          {/* 5. SEO DELIVERIES SUMMARY */}
          {sectionsList.includes("deliveries") && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>SEO Campaign Placements & Deliveries</h2>
              {deliveriesData && deliveriesData.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Delivery Type</th>
                        <th>Placement Details</th>
                        <th>Details Ledger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveriesData.map((d) => (
                        <tr key={d.id}>
                          <td>{new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td>
                            <span className={`${styles.deliveryBadge} ${styles[d.type.toLowerCase()]}`}>
                              {d.type === "BACKLINK" ? <LinkIcon size={10} style={{ marginRight: "4px" }} /> : <FileText size={10} style={{ marginRight: "4px" }} />}
                              {d.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{d.description}</td>
                          <td>
                            {d.type === "BACKLINK" && d.linkDetails && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                DA: {d.linkDetails.domainAuthority} | Target: {(d.linkDetails.targetUrl || d.linkDetails.url || "").replace(/^(https?:\/\/)?(www\.)?/, "").slice(0, 30)}
                              </span>
                            )}
                            {d.type === "CONTENT" && d.contentDetails && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Words: {d.contentDetails.wordCount} words
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem", border: "1px dashed var(--border-color)", borderRadius: "6px" }}>
                  No backlinks or content items were delivered during this reporting period.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.emptyArea} style={{ padding: "80px 20px" }}>
          <AlertCircle size={36} style={{ color: "var(--text-muted)" }} />
          <h3>Report Data Not Generated</h3>
          <p>The administrator has not compiled the metrics snapshot for this report period yet.</p>
        </div>
      )}
    </div>
  );
}
