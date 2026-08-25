"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  RefreshCw, 
  Edit, 
  Download, 
  Share2, 
  Calendar, 
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Globe,
  Database,
  TrendingUp,
  TrendingDown,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";
import { useConfirm } from "@/components/ConfirmContext";
import { handleApiError } from "@/lib/apiUtils";

interface ConnectionDetail {
  id: number;
  provider: string;
  status: string;
}

interface PropertyDetail {
  id: number;
  domain: string;
  name: string;
}

interface ClientDetail {
  id: number;
  name: string;
  companyName: string | null;
  properties: PropertyDetail[];
}

interface ReportDetail {
  id: number;
  clientId: number;
  propertyId: number | null;
  name: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  comparisonRange: string;
  status: string;
  sections: string; // JSON string array
  shareToken: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function ReportDetailsPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const { toast, success, error } = useToast();
  const { confirm } = useConfirm();
  const { reportId: reportIdStr } = use(params);
  const reportId = parseInt(reportIdStr, 10);

  // Load States
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Control Actions States
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form Config edit values
  const [editName, setEditName] = useState("");
  const [editPropertyId, setEditPropertyId] = useState("");
  const [editDateRange, setEditDateRange] = useState("30d");
  const [editCustomStart, setEditCustomStart] = useState("");
  const [editCustomEnd, setEditCustomEnd] = useState("");
  const [editComparison, setEditComparison] = useState("PREV_PERIOD");
  const [editSections, setEditSections] = useState<string[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Fetch report config & snapshot details
  const fetchReportDetails = useCallback(async () => {
    if (isNaN(reportId)) return;
    setLoading(true);
    setPageError("");
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Report not found.");
        }
        throw new Error("Failed to load report configuration.");
      }
      const data: ReportDetail = await res.json();
      setReport(data);

      // Initialize edit fields
      setEditName(data.name);
      setEditPropertyId(data.propertyId?.toString() || "");
      setEditDateRange(data.dateRange);
      setEditComparison(data.comparisonRange);
      setEditSections(JSON.parse(data.sections || "[]"));
      
      if (data.dateRange === "custom") {
        setEditCustomStart(data.startDate.split("T")[0]);
        setEditCustomEnd(data.endDate.split("T")[0]);
      }
    } catch (err: any) {
      setPageError(err.message || "Failed to load report details.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReportDetails();
  }, [fetchReportDetails]);

  if (loading && !report) {
    return (
      <div className={styles.loaderArea} style={{ padding: "120px" }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (pageError || !report) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard} style={{ margin: "40px auto", maxWidth: "480px" }}>
          <AlertCircle size={36} style={{ color: "var(--error)" }} />
          <h3>Report Load Error</h3>
          <p>{pageError || "The requested report configuration does not exist."}</p>
          <Link href="/admin/reports" className={styles.btnActionSecondary}>
            <ArrowLeft size={14} style={{ marginRight: "6px" }} />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  // Parse snapshot JSON data if READY
  const hasSnapshot = report.snapshots && report.snapshots.length > 0;
  const snapshot = hasSnapshot ? report.snapshots[0] : null;

  let metricsData: any = null;
  let historyData: any = null;
  let deliveriesData: any[] = [];
  let sectionsList: string[] = [];

  try {
    sectionsList = JSON.parse(report.sections || "[]");
    if (snapshot) {
      metricsData = JSON.parse(snapshot.metricsJson || "{}");
      historyData = JSON.parse(snapshot.historyJson || "{}");
      deliveriesData = JSON.parse(snapshot.deliveriesJson || "[]");
    }
  } catch (parseErr) {
    console.error("Failed to parse report snapshot JSON payloads:", parseErr);
  }

  // Trigger manual regeneration
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/regenerate`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to process regeneration request.");
      success("Report snapshot generated successfully!");
      fetchReportDetails();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error }, fallbackMessage: "Failed to generate snapshot." });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Save report config changes
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      error("Report name is required.");
      return;
    }
    if (editDateRange === "custom" && (!editCustomStart || !editCustomEnd)) {
      error("Please provide start and end dates.");
      return;
    }

    setIsSavingConfig(true);
    try {
      const payload = {
        name: editName.trim(),
        propertyId: editPropertyId ? parseInt(editPropertyId, 10) : null,
        dateRange: editDateRange,
        startDate: editDateRange === "custom" ? new Date(editCustomStart) : undefined,
        endDate: editDateRange === "custom" ? new Date(editCustomEnd) : undefined,
        comparisonRange: editComparison,
        sections: editSections
      };

      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save configuration settings.");
      setIsEditing(false);
      success("Report configuration updated! Please click 'Regenerate Report' to rebuild the data snapshot.");
      fetchReportDetails();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error }, fallbackMessage: "Failed to update settings." });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Section checkbox toggle
  const handleToggleEditSection = (sect: string) => {
    if (editSections.includes(sect)) {
      setEditSections(editSections.filter(s => s !== sect));
    } else {
      setEditSections([...editSections, sect]);
    }
  };

  // Copy share URL
  const handleCopyLink = async () => {
    if (!report.shareToken) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/share/reports/${report.shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      success("Link copied to clipboard");
    } catch {
      error("Failed to copy link.");
    }
  };

  // Revoke/Regenerate share token
  const handleRegenerateShareToken = async () => {
    const isConfirmed = await confirm({
      title: "Regenerate Share Link",
      message: "Are you sure you want to regenerate the share token? Any previously shared link will stop working.",
      confirmText: "Regenerate",
      destructive: true
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/reports/${reportId}/share-token`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate token.");
      success("Sharing link regenerated successfully.");
      fetchReportDetails();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error }, fallbackMessage: "Failed to regenerate share token." });
    }
  };

  // Format period details
  const getPeriodLabel = () => {
    const start = new Date(report.startDate);
    const end = new Date(report.endDate);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Render SVG Trend chart
  const renderTrendSVG = (metricKey: "sessions" | "organicTraffic" | "conversions") => {
    const currentTimeline = historyData?.current || [];
    const prevTimeline = historyData?.previous || [];

    if (currentTimeline.length < 2) {
      return (
        <div className={styles.noChartData}>
          Not enough historical snapshots to plot trendline.
        </div>
      );
    }

    const currentValues = currentTimeline.map((h: any) => h[metricKey]);
    const prevValues = prevTimeline.map((h: any) => h[metricKey]);
    const maxVal = Math.max(...currentValues, ...prevValues, 100);
    const minVal = 0;
    
    const chartHeight = 180;
    const width = 800;
    const paddingY = 15;
    const stepX = width / (currentTimeline.length - 1);

    const getPointsStr = (dataset: any[]) => {
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
            <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
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
            <path d={`M 0,${chartHeight - paddingY} L ${currentPoints} L ${width},${chartHeight - paddingY} Z`} fill={`url(#grad-${metricKey})`} />
          )}
          {currentPoints && (
            <polyline fill="none" stroke="var(--accent-color)" strokeWidth="2" points={currentPoints} />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Printable Sheet Wrapper */}
      <div className="no-print">
        <div className={styles.breadcrumbBar}>
          <Link href="/admin/reports" className={styles.btnBackLink}>
            <ArrowLeft size={14} />
            Back to Reports Ledger
          </Link>
        </div>
      </div>

      {/* Report Header block */}
      <div className={`${styles.reportHeaderCard} ${styles.card}`}>
        <div className={styles.reportHeaderMain}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 className={styles.reportTitleText}>{report.name}</h1>
              <span className={`${styles.statusBadge} ${styles[report.status.toLowerCase()]}`}>
                {report.status}
              </span>
            </div>
            <p className={styles.reportSubtitleText}>
              Client: <strong>{report.client.name}</strong> 
              {report.property && (
                <> • Domain: <strong>{report.property.domain}</strong></>
              )}
            </p>
            <span className={styles.generatedTimestamp}>
              Period: {getPeriodLabel()}
              {snapshot && ` | Generated on: ${new Date(snapshot.generatedAt).toLocaleString()}`}
            </span>
          </div>

          {/* Action Row - Hidden on print preview */}
          <div className={`${styles.actionsGroup} no-print`}>
            {report.status !== "GENERATING" && (
              <button onClick={handleRegenerate} className={styles.btnActionSecondary} disabled={isRegenerating}>
                <RefreshCw size={13} className={isRegenerating ? "spin" : ""} />
                Regenerate Data
              </button>
            )}

            <button onClick={() => setIsEditing(true)} className={styles.btnActionSecondary}>
              <Edit size={13} />
              Edit Settings
            </button>

            <button onClick={() => window.print()} className={styles.btnActionSecondary} disabled={report.status !== "READY"}>
              <Download size={13} />
              Print/Download PDF
            </button>

            <button 
              onClick={() => setIsShareOpen(!isShareOpen)} 
              className={styles.btnActionPrimary}
              disabled={report.status !== "READY"}
            >
              <Share2 size={13} style={{ marginRight: "4px" }} />
              Share Report
            </button>

            {isShareOpen && (
              <div className={styles.sharePopover}>
                <h4>Secure Share Link</h4>
                <p>Allow clients to view this report snapshot without logging in.</p>
                <div className={styles.shareInputRow}>
                  <div className={styles.shareLinkBox}>
                    {report.shareToken ? `${window.location.origin}/share/reports/${report.shareToken}` : "No link"}
                  </div>
                  <button onClick={handleCopyLink} title="Copy shared URL">
                    {copiedLink ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button onClick={handleRegenerateShareToken} className={styles.btnPopoverAction}>
                    Regenerate Link
                  </button>
                  <button onClick={() => setIsShareOpen(false)} className={styles.btnPopoverAction} style={{ background: "transparent" }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning notification for non-ready states */}
        {report.status === "DRAFT" && (
          <div className={styles.warningAlert}>
            <AlertTriangle size={16} />
            <span>This report's configuration has changed. Please click <strong>Regenerate Data</strong> to compile the updated metrics snapshot.</span>
          </div>
        )}
        {report.status === "GENERATING" && (
          <div className={styles.loadingAlert}>
            <RefreshCw size={16} className="spin" />
            <span>Querying active analytics databases and creating snaphot... Please wait a few seconds.</span>
          </div>
        )}
        {report.status === "FAILED" && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>Snapshot generation failed. Verify client credentials and properties connections setups.</span>
          </div>
        )}
      </div>

      {/* Main Stored Snapshot Display - Print Target */}
      {report.status === "READY" && snapshot && (
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
                      <span className={`${styles.deltaBadge} ${metricsData.sessionsChange >= 0 ? styles.positive : styles.negative}`}>
                        {metricsData.sessionsChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {metricsData.sessionsChange >= 0 ? "+" : ""}{metricsData.sessionsChange}%
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
                      <span className={`${styles.deltaBadge} ${metricsData.organicTrafficChange >= 0 ? styles.positive : styles.negative}`}>
                        {metricsData.organicTrafficChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {metricsData.organicTrafficChange >= 0 ? "+" : ""}{metricsData.organicTrafficChange}%
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
                      <span className={`${styles.deltaBadge} ${metricsData.conversionsChange >= 0 ? styles.positive : styles.negative}`}>
                        {metricsData.conversionsChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {metricsData.conversionsChange >= 0 ? "+" : ""}{metricsData.conversionsChange}%
                      </span>
                      <span className={styles.deltaLabel}>vs comparison period</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. ORGANIC SESSIONS DETAIL TIMELINE */}
          {sectionsList.includes("sessions") && historyData && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>Organic Sessions Over Time (GA4)</h2>
              {renderTrendSVG("sessions")}
            </div>
          )}

          {/* 3. GSC SEARCH PERFORMANCE DETAIL TIMELINE */}
          {sectionsList.includes("organic") && historyData && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>Google Search Console Click Trends</h2>
              {renderTrendSVG("organicTraffic")}
            </div>
          )}

          {/* 4. CONVERSIONS PERFORMANCE TIMELINE */}
          {sectionsList.includes("conversions") && historyData && (
            <div className={`${styles.card} page-break`}>
              <h2 className={styles.sectionTitle}>Goal Conversions Timeline (GA4)</h2>
              {renderTrendSVG("conversions")}
            </div>
          )}

          {/* 5. COMPLETED CAMPAIGN DELIVERIES SUMMARY */}
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
                      {deliveriesData.map((d: any) => (
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
                                DA: {d.linkDetails.domainAuthority} | Target: {d.linkDetails.targetUrl.replace(/^(https?:\/\/)?(www\.)?/, "").slice(0, 30)}
                              </span>
                            )}
                            {d.type === "CONTENT" && d.contentDetails && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Words: {d.contentDetails.wordCount} words | URL: {d.contentDetails.url}
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
      )}

      {/* Edit Configuration Settings Modal Overlay */}
      {isEditing && (
        <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Edit Report Settings</h3>
            <form onSubmit={handleSaveConfig} className={styles.modalForm}>
              
              <div className={styles.formGroup}>
                <label>Report Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Website Property</label>
                <select
                  value={editPropertyId}
                  onChange={(e) => setEditPropertyId(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">All properties / Aggregated</option>
                  {report.client.properties.map(p => (
                    <option key={p.id} value={p.id}>{p.domain}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Date Range Code</label>
                <select
                  value={editDateRange}
                  onChange={(e) => setEditDateRange(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {editDateRange === "custom" && (
                <div className={styles.formDateRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      required
                      value={editCustomStart}
                      onChange={(e) => setEditCustomStart(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Date</label>
                    <input
                      type="date"
                      required
                      value={editCustomEnd}
                      onChange={(e) => setEditCustomEnd(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Comparison Period</label>
                <select
                  value={editComparison}
                  onChange={(e) => setEditComparison(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="PREV_PERIOD">Previous Equivalent Period (Delta)</option>
                  <option value="NONE">No Comparison</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Report Sections</label>
                <div className={styles.checkboxGroup}>
                  {[
                    { id: "overview", label: "Executive Summary Metrics" },
                    { id: "sessions", label: "Organic Sessions (GA4)" },
                    { id: "organic", label: "Search Console Clicks (GSC)" },
                    { id: "conversions", label: "Conversions & Goal Metrics" },
                    { id: "deliveries", label: "Completed SEO Deliveries" }
                  ].map((s) => (
                    <label key={s.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editSections.includes(s.id)}
                        onChange={() => handleToggleEditSection(s.id)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnActionSecondary}
                  onClick={() => setIsEditing(false)}
                  disabled={isSavingConfig}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnActionPrimary}
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? "Saving configuration..." : "Save Config Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
