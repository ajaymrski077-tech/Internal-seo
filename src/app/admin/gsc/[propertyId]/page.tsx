"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Loader2, Settings, AlertCircle, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import { handleApiError } from "@/lib/apiUtils";
import { useToast } from "@/components/ToastContext";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface GscDetailData {
  property: { id: number; domain: string; clientName: string; };
  metrics: { totalClicks: number; clicksDelta: number; totalImpressions: number; impressionsDelta: number; avgCtr: string; avgPosition: string; };
  chartData: { date: string; clicks: number; impressions: number; }[];
  topPages: { page: string; clicks: number; impressions: number; position: number; }[];
  topQueries: { query: string; clicks: number; impressions: number; position: number; }[];
  strikingDistanceGrouped: { page: string; totalQueries: number; bestPos: number; estClicks: number; queries: { query: string; clicks: number; impressions: number; position: number; }[] }[];
  contentDecay: { page: string; currentClicks: number; prevClicks: number; diff: number; diffPct: number; currentImpressions?: number; prevImpressions?: number; diffImp?: number; diffPctImp?: number; }[];
  ctrGaps: { query: string; position: number; actualCtr: number; expectedCtr: number; gap: number; extraClicks: number; }[];
  cannibalization: { query: string; pages: { page: string; clicks: number; impressions: number; position: number; }[] }[];
  onPageSeo: { page: string; topQuery: string; impressions: number; position: number; title: boolean; meta: boolean; h1: boolean; }[];
}

export default function GscPropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const resolvedParams = use(params);
  const { error: toastError } = useToast();
  
  const [data, setData] = useState<GscDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [days, setDays] = useState(28);
  const [brandFilter, setBrandFilter] = useState("non-branded");
  
  // Tab State
  const [activeTab, setActiveTab] = useState("Overview"); // Default to Overview
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Tab-specific filters
  const [decayMetric, setDecayMetric] = useState<"clicks" | "impressions">("clicks");
  const [onPageFilter, setOnPageFilter] = useState<"all" | "title" | "meta" | "h1">("all");
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [showAllPages, setShowAllPages] = useState(false);
  const [showAllQueries, setShowAllQueries] = useState(false);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => [...prev, id]);
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/gsc/${resolvedParams.propertyId}/detail?days=${days}&brand=${brandFilter}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load property details");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj?.message || "Failed to load property details");
      handleApiError(err, { 
        toast: { error: toastError },
        fallbackMessage: "Failed to load property details"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.propertyId, days, brandFilter, toastError]);

  if (!data && loading) {
    return (
      <div className={styles.container} style={{ padding: "32px", display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <Loader2 className={styles.emptyIcon} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container} style={{ padding: "40px", maxWidth: "800px", margin: "40px auto", textAlign: "center", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
        <AlertCircle size={48} style={{ color: "#EA580C", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#0F172A", margin: "0 0 8px 0" }}>Google Search Console Unavailable</h2>
        <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 24px 0" }}>
          {errorMessage || "This property is not currently connected to Google Search Console or credentials require authorization."}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/admin/gsc" className={styles.btnSecondary} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            &larr; Back to GSC Properties
          </Link>
          <Link href="/admin/gsc/settings" className={styles.btnPrimary} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            <Settings size={14} style={{ marginRight: "6px" }} /> GSC Settings
          </Link>
        </div>
      </div>
    );
  }

  const activeNotificationsCount = [
    data.metrics.clicksDelta < -5 && !dismissedNotifications.includes("traffic_drop"),
    data.contentDecay.length > 0 && !dismissedNotifications.includes("content_decay"),
    data.cannibalization.length > 0 && !dismissedNotifications.includes("cannibalization")
  ].filter(Boolean).length;

  const tabs = [
    { name: "Overview" },
    { name: "Striking Distance" },
    { name: "Content Decay" },
    { name: "CTR Gaps" },
    { name: "Cannibalization" },
    { name: "On-Page SEO" },
    { name: "Notifications", badge: activeNotificationsCount > 0 ? activeNotificationsCount : undefined },
  ];

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/gsc" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", marginBottom: "8px", display: "inline-block" }}>
          &larr; GSC Intelligence
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className={styles.title} style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>{data.property.clientName}</h1>
          <Link href="/admin/gsc/settings" style={{ fontSize: "13px", padding: "6px 14px", background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", textDecoration: "none", color: "#334155", fontWeight: "500" }}>
            <Settings size={14} /> Settings
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px", fontSize: "14px", color: "#64748B", overflowX: "auto" }}>
        {tabs.map(t => (
          <div 
            key={t.name}
            onClick={() => setActiveTab(t.name)}
            style={{ 
              color: activeTab === t.name ? "#0F172A" : "#64748B", 
              borderBottom: activeTab === t.name ? "2px solid #0F4C5C" : "none", 
              paddingBottom: "12px", 
              fontWeight: activeTab === t.name ? "700" : "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {t.name}
            {t.badge !== undefined && (
              <span style={{ background: "#EF4444", color: "white", padding: "1px 6px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                {t.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#059669", background: "#D1FAE5", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>
            Data loaded for last {days} days
          </span>
          <button onClick={loadData} disabled={loading} style={{ border: "1px solid #E2E8F0", background: "white", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ display: "flex", border: "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden", background: "white", fontSize: "12px" }}>
            {[28, 90, 180, 365].map(d => (
              <button key={d} onClick={() => setDays(d)}
                style={{ padding: "6px 12px", background: days === d ? "#0F172A" : "transparent", color: days === d ? "white" : "inherit", border: "none", borderLeft: d !== 28 ? "1px solid #E2E8F0" : "none", cursor: "pointer" }}
              >
                {d === 180 ? "6m" : d === 365 ? "12m" : `${d}d`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", border: "1px solid #E2E8F0", borderRadius: "6px", overflow: "hidden", background: "white", fontSize: "12px" }}>
            {[
              { id: "non-branded", label: "Non-branded" },
              { id: "all", label: "All" },
              { id: "branded", label: "Branded" }
            ].map(b => (
              <button key={b.id} onClick={() => setBrandFilter(b.id)}
                style={{ padding: "6px 12px", background: brandFilter === b.id ? "#334155" : "transparent", color: brandFilter === b.id ? "white" : "inherit", border: "none", borderLeft: b.id !== "non-branded" ? "1px solid #E2E8F0" : "none", cursor: "pointer" }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
          <Loader2 className={styles.emptyIcon} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {!loading && activeTab === "Overview" && (
        <>
          {/* Overview Content */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Clicks", value: data.metrics.totalClicks.toLocaleString(), color: "#3B82F6", delta: data.metrics.clicksDelta },
              { label: "Total Impressions", value: data.metrics.totalImpressions.toLocaleString(), color: "#9F1239", delta: data.metrics.impressionsDelta },
              { label: "Average CTR", value: `${data.metrics.avgCtr}%`, color: "#0F172A", delta: null },
              { label: "Average Position", value: data.metrics.avgPosition, color: "#0F172A", delta: null }
            ].map((m, i) => (
              <div key={i} style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <div style={{ width: "12px", height: "12px", background: m.color, borderRadius: "2px" }}></div>
                  <span style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>{m.label}</span>
                </div>
                <div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: m.color }}>{m.value}</div>
                  {m.delta !== null && (
                    <div style={{ fontSize: "12px", color: m.delta < 0 ? "#EF4444" : "#10B981", marginTop: "4px", fontWeight: "500" }}>
                      {m.delta < 0 ? "▼" : "▲"} {Math.abs(m.delta).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748B", fontWeight: "500" }}>
                <div style={{ width: "12px", height: "4px", background: "#3B82F6", borderRadius: "2px" }}></div> Clicks
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748B", fontWeight: "500" }}>
                <div style={{ width: "12px", height: "4px", background: "#8B5CF6", borderRadius: "2px" }}></div> Impressions
              </div>
            </div>
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{fontSize: 11}} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis yAxisId="left" tick={{fontSize: 11, fill: '#3B82F6'}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 11, fill: '#8B5CF6'}} tickLine={false} axisLine={false} />
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", background: "rgba(15, 23, 42, 0.8)", color: "white" }} itemStyle={{ color: "white" }} />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} fillOpacity={0.1} fill="#3B82F6" />
                  <Area yAxisId="right" type="monotone" dataKey="impressions" stroke="#8B5CF6" strokeWidth={2} fillOpacity={0.1} fill="#8B5CF6" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>Top Pages</h3>
                <span 
                  onClick={() => setShowAllPages(!showAllPages)}
                  style={{ fontSize: "12px", color: "#0F4C5C", cursor: "pointer", fontWeight: "600" }}
                >
                  {showAllPages ? "Show less ↑" : "View all →"}
                </span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ color: "#94A3B8", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "12px 0", textAlign: "left", fontWeight: "400" }}>Page</th>
                    <th style={{ padding: "12px 0", textAlign: "right", fontWeight: "400" }}>Clicks</th>
                    <th style={{ padding: "12px 0", textAlign: "right", fontWeight: "400" }}>Impr</th>
                    <th style={{ padding: "12px 0", textAlign: "right", fontWeight: "400" }}>Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllPages ? data.topPages : data.topPages.slice(0, 10)).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F8FAFC" }}>
                      <td style={{ padding: "12px 0", color: "#334155", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.page || "/"}</td>
                      <td style={{ padding: "12px 0", textAlign: "right", color: "#3B82F6", fontWeight: "500" }}>{p.clicks.toLocaleString()}</td>
                      <td style={{ padding: "12px 0", textAlign: "right", color: "#94A3B8" }}>{p.impressions.toLocaleString()}</td>
                      <td style={{ padding: "12px 0", textAlign: "right", color: "#94A3B8" }}>{p.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>Top Queries</h3>
                <span 
                  onClick={() => setShowAllQueries(!showAllQueries)}
                  style={{ fontSize: "12px", color: "#0F4C5C", cursor: "pointer", fontWeight: "600" }}
                >
                  {showAllQueries ? "Show less ↑" : "View all →"}
                </span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ color: "#94A3B8", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "12px 0", textAlign: "left", fontWeight: "400" }}>Query</th>
                    <th style={{ padding: "12px 0", textAlign: "right", fontWeight: "400" }}>Clicks</th>
                    <th style={{ padding: "12px 0", textAlign: "right", fontWeight: "400" }}>Impr</th>
                    <th style={{ padding: "12px 0", textAlign: "right", fontWeight: "400" }}>Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllQueries ? data.topQueries : data.topQueries.slice(0, 10)).map((q, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F8FAFC" }}>
                      <td style={{ padding: "12px 0", color: "#334155", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.query}</td>
                      <td style={{ padding: "12px 0", textAlign: "right", color: "#3B82F6", fontWeight: "500" }}>{q.clicks.toLocaleString()}</td>
                      <td style={{ padding: "12px 0", textAlign: "right", color: "#94A3B8" }}>{q.impressions.toLocaleString()}</td>
                      <td style={{ padding: "12px 0", textAlign: "right", color: "#94A3B8" }}>{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && activeTab === "Striking Distance" && (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#0F172A" }}>Striking Distance</h3>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                {data.strikingDistanceGrouped.length} pages · {data.strikingDistanceGrouped.reduce((s, g) => s + g.totalQueries, 0)} queries at positions 4-20.
              </div>
            </div>
            <button style={{ padding: "6px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Expand all</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.strikingDistanceGrouped.length === 0 && <div style={{ color: "#64748B", fontSize: "13px" }}>No striking distance data found.</div>}
            
            {data.strikingDistanceGrouped.map((group, idx) => (
              <div key={idx} style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                <div 
                  onClick={() => toggleRow(`sd-${idx}`)}
                  style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expandedRows[`sd-${idx}`] ? "#F8FAFC" : "white" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#0F172A" }}>
                    {expandedRows[`sd-${idx}`] ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
                    {group.page || "/"}
                  </div>
                  <div style={{ display: "flex", gap: "24px", fontSize: "13px", fontWeight: "500" }}>
                    <span style={{ color: "#94A3B8" }}>{group.totalQueries} queries</span>
                    <span style={{ color: "#059669" }}>Best pos: {group.bestPos.toFixed(1)}</span>
                    <span style={{ color: "#10B981" }}>+{group.estClicks} est. clicks</span>
                  </div>
                </div>
                
                {expandedRows[`sd-${idx}`] && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", background: "white", borderTop: "1px solid #E2E8F0" }}>
                    <thead>
                      <tr style={{ color: "#94A3B8", textAlign: "left" }}>
                        <th style={{ padding: "12px 16px", fontWeight: "400" }}>Query</th>
                        <th style={{ padding: "12px 16px", fontWeight: "400", textAlign: "right" }}>Pos</th>
                        <th style={{ padding: "12px 16px", fontWeight: "400", textAlign: "right" }}>Impressions</th>
                        <th style={{ padding: "12px 16px", fontWeight: "400", textAlign: "right" }}>Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.queries.map((q, qIdx) => (
                        <tr key={qIdx} style={{ borderTop: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px", color: "#334155" }}>{q.query}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#F59E0B", fontWeight: "500" }}>{q.position.toFixed(1)}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#64748B" }}>{q.impressions.toLocaleString()}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#3B82F6" }}>{q.clicks.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab === "Content Decay" && (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>Metric</span>
              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: "4px", padding: "2px" }}>
                <button 
                  onClick={() => setDecayMetric("clicks")}
                  style={{ background: decayMetric === "clicks" ? "#0F4C5C" : "transparent", color: decayMetric === "clicks" ? "white" : "#64748B", border: "none", borderRadius: "4px", padding: "4px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                    Clicks
                </button>
                <button 
                  onClick={() => setDecayMetric("impressions")}
                  style={{ background: decayMetric === "impressions" ? "#0F4C5C" : "transparent", color: decayMetric === "impressions" ? "white" : "#64748B", border: "none", borderRadius: "4px", padding: "4px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                    Impressions
                </button>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B", marginLeft: "16px" }}>Threshold</span>
              <div style={{ width: "80px", height: "4px", background: "#E2E8F0", borderRadius: "2px", position: "relative" }}>
                <div style={{ width: "8px", height: "8px", background: "#64748B", borderRadius: "50%", position: "absolute", top: "-2px", left: "0" }} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A" }}>0%</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ padding: "5px 12px", background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>Show all</button>
              <button style={{ padding: "5px 12px", background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>Export CSV</button>
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ color: "#94A3B8", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600" }}>Page</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600" }}>Current Period</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600" }}>Prev Period</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600" }}>Diff</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600" }}>Change %</th>
                </tr>
              </thead>
              <tbody>
                {data.contentDecay.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No content decay detected for this period.</td>
                  </tr>
                ) : (
                  data.contentDecay
                    .filter(row => decayMetric === "clicks" ? row.diff < 0 : (row.diffImp || 0) < 0)
                    .sort((a, b) => decayMetric === "clicks" ? a.diff - b.diff : (a.diffImp || 0) - (b.diffImp || 0))
                    .map((row, idx) => {
                      const current = decayMetric === "clicks" ? row.currentClicks : (row.currentImpressions || 0);
                      const prev = decayMetric === "clicks" ? row.prevClicks : (row.prevImpressions || 0);
                      const pct = decayMetric === "clicks" ? row.diffPct : (row.diffPctImp || 0);
                      const diffVal = decayMetric === "clicks" ? row.diff : (row.diffImp || 0);

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "500", maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.page || "/"}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#0F172A", fontWeight: "700" }}>
                            {current.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#64748B" }}>
                            {prev.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#EF4444", fontWeight: "600" }}>
                            {diffVal.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                              ▼ {Math.abs(pct).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "Notifications" && (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>Notifications</h3>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                Automated anomaly detection. Checks run nightly at 4am.
              </div>
            </div>
            <button onClick={() => setDismissedNotifications([])} style={{ padding: "6px 14px", background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#0F172A", cursor: "pointer" }}>
              Reset checks
            </button>
          </div>
          
          {/* Active Notifications (computed from real data) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
            
            {/* 1. Traffic Drop Alert if organic traffic dropped */}
            {data.metrics.clicksDelta < -5 && !dismissedNotifications.includes("traffic_drop") && (
              <div style={{ border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }} />
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#991B1B" }}>
                      Traffic dropped {Math.abs(data.metrics.clicksDelta)}% vs previous period
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#FEE2E2", color: "#B91C1C", padding: "2px 8px", borderRadius: "10px" }}>Critical</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#991B1B" }}>Live</span>
                    <button onClick={() => dismissNotification("traffic_drop")} style={{ padding: "3px 10px", fontSize: "11px", fontWeight: "600", color: "#991B1B", background: "white", border: "1px solid #FECACA", borderRadius: "4px", cursor: "pointer" }}>Dismiss</button>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#B91C1C" }}>
                  {data.metrics.totalClicks.toLocaleString()} total clicks recorded (vs previous period).
                </div>
              </div>
            )}

            {/* 2. Content Decay Alert if pages are losing traffic */}
            {data.contentDecay.length > 0 && !dismissedNotifications.includes("content_decay") && (
              <div style={{ border: "1px solid #FDE68A", background: "#FFFBEB", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#92400E" }}>
                      {data.contentDecay.length} pages experiencing traffic decay
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: "10px" }}>High</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#92400E" }}>Live</span>
                    <button onClick={() => dismissNotification("content_decay")} style={{ padding: "3px 10px", fontSize: "11px", fontWeight: "600", color: "#92400E", background: "white", border: "1px solid #FDE68A", borderRadius: "4px", cursor: "pointer" }}>Dismiss</button>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#B45309", marginBottom: "6px", fontWeight: "600" }}>Top affected pages:</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {data.contentDecay.slice(0, 5).map((item, idx) => (
                    <span key={idx} style={{ fontSize: "11px", color: "#92400E", background: "#FEF3C7", padding: "3px 8px", borderRadius: "4px" }}>
                      {item.page || "/"} (▼ {Math.abs(item.diffPct).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Cannibalization Alert */}
            {data.cannibalization.length > 0 && !dismissedNotifications.includes("cannibalization") && (
              <div style={{ border: "1px solid #FED7AA", background: "#FFF7ED", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EA580C" }} />
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#9A3412" }}>
                      {data.cannibalization.length} keyword cannibalization conflicts detected
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#FFEDD5", color: "#C2410C", padding: "2px 8px", borderRadius: "10px" }}>Medium</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#9A3412" }}>Live</span>
                    <button onClick={() => dismissNotification("cannibalization")} style={{ padding: "3px 10px", fontSize: "11px", fontWeight: "600", color: "#9A3412", background: "white", border: "1px solid #FED7AA", borderRadius: "4px", cursor: "pointer" }}>Dismiss</button>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#C2410C" }}>
                  Competing queries: {data.cannibalization.slice(0, 3).map(c => c.query).join(", ")}
                </div>
              </div>
            )}

            {data.metrics.clicksDelta >= -5 && data.contentDecay.length === 0 && data.cannibalization.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748B", background: "#F8FAFC", borderRadius: "8px" }}>
                No active anomalies detected. All search health metrics are stable.
              </div>
            )}
          </div>

          {/* DISMISSED SECTION */}
          {dismissedNotifications.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                DISMISSED ALERTS ({dismissedNotifications.length})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {dismissedNotifications.map((dId, idx) => (
                  <div key={idx} style={{ border: "1px solid #F1F5F9", background: "#FAFAFA", borderRadius: "8px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#CBD5E1" }} />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
                          {dId.replace(/_/g, " ").toUpperCase()} anomaly dismissed
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>Dismissed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {!loading && activeTab === "CTR Gaps" && (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>CTR Gaps</h3>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                {data.ctrGaps.length} queries below expected CTR based on position.
              </div>
            </div>
            <button style={{ padding: "6px 14px", background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", fontWeight: "600", color: "#0F172A", cursor: "pointer" }}>
              Expand all
            </button>
          </div>
          
          {/* Group Header Bar */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                <span style={{ fontSize: "10px", color: "#64748B" }}>▼</span>
                All Pages
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px" }}>
                <span style={{ color: "#64748B" }}>{data.ctrGaps.length} queries</span>
                <span style={{ color: "#10B981", fontWeight: "700" }}>
                  +{data.ctrGaps.reduce((acc, q) => acc + q.extraClicks, 0).toLocaleString()} potential clicks
                </span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ color: "#94A3B8", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "10px 18px", textAlign: "left", fontWeight: "600" }}>Query</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>Pos</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>Actual CTR</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>Expected</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>Gap</th>
                  <th style={{ padding: "10px 18px", textAlign: "right", fontWeight: "600" }}>Extra clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.ctrGaps.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94A3B8" }}>No significant CTR gaps detected.</td>
                  </tr>
                ) : (
                  data.ctrGaps.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 18px", color: "#334155", fontWeight: "500" }}>{row.query}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: "600" }}>{row.position.toFixed(1)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#334155" }}>{row.actualCtr.toFixed(1)}%</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748B" }}>{row.expectedCtr}%</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#EF4444", fontWeight: "600" }}>{row.gap.toFixed(1)}%</td>
                      <td style={{ padding: "10px 18px", textAlign: "right", color: "#10B981", fontWeight: "700" }}>+{row.extraClicks.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === "Cannibalization" && (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Keyword Cannibalization</h3>
          {data.cannibalization.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#64748B", fontSize: "13px" }}>No cannibalization issues detected.</div>
          ) : (
            data.cannibalization.map((group, idx) => (
              <div key={idx} style={{ padding: "16px 0", borderBottom: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} color="#EF4444" /> {group.query}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <tbody>
                    {group.pages.map((p, pIdx) => (
                      <tr key={pIdx}>
                        <td style={{ padding: "6px 0", color: "#3B82F6", maxWidth: "400px" }}>{p.page || "/"}</td>
                        <td style={{ padding: "6px 0", textAlign: "right", color: "#64748B" }}>Pos: {(p.position || 0).toFixed(1)}</td>
                        <td style={{ padding: "6px 0", textAlign: "right", color: "#64748B" }}>{p.impressions || 0} Impr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "On-Page SEO" && (
        <div>
          {/* Real live metric counters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
            {[
              { label: "Total Pages Analyzed", value: data.onPageSeo.length, color: "#0F172A" },
              { label: "Issues Found", value: data.onPageSeo.filter(x => !x.title || !x.meta || !x.h1).length, color: "#EF4444" },
              { label: "Missing from Title", value: data.onPageSeo.filter(x => !x.title).length, color: "#F59E0B" },
              { label: "Missing from Meta", value: data.onPageSeo.filter(x => !x.meta).length, color: "#8B5CF6" }
            ].map((m, i) => (
              <div key={i} style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: "12px", color: "#64748B", fontWeight: "600", marginBottom: "6px" }}>{m.label}</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            {/* Filter pills bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { id: "all", label: `All (${data.onPageSeo.length})` },
                  { id: "title", label: `Title (${data.onPageSeo.filter(x => !x.title).length})` },
                  { id: "meta", label: `Meta (${data.onPageSeo.filter(x => !x.meta).length})` },
                  { id: "h1", label: `H1 (${data.onPageSeo.filter(x => !x.h1).length})` },
                ].map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setOnPageFilter(f.id as typeof onPageFilter)}
                    style={{ 
                      padding: "4px 12px", 
                      fontSize: "0.75rem", 
                      fontWeight: "700", 
                      background: onPageFilter === f.id ? "#0F4C5C" : "#F1F5F9", 
                      color: onPageFilter === f.id ? "white" : "#475569", 
                      border: "none", 
                      borderRadius: "4px", 
                      cursor: "pointer" 
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button style={{ padding: "5px 12px", fontSize: "0.75rem", background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", color: "#334155", cursor: "pointer" }}>Export CSV</button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ color: "#64748B", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "700" }}>Page</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: "700" }}>Top Query</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700" }}>Impressions</th>
                  <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700" }}>Position</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: "700" }}>Title</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: "700" }}>Meta</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: "700" }}>H1</th>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "700" }}>Suggestion</th>
                  <th style={{ padding: "12px 18px", textAlign: "center", fontWeight: "700" }}></th>
                </tr>
              </thead>
              <tbody>
                {data.onPageSeo.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>No on-page SEO data analyzed yet.</td>
                  </tr>
                ) : (
                  data.onPageSeo
                    .filter(row => {
                      if (onPageFilter === "title") return !row.title;
                      if (onPageFilter === "meta") return !row.meta;
                      if (onPageFilter === "h1") return !row.h1;
                      return true;
                    })
                    .map((row, idx) => {
                      const isOptimised = row.title && row.meta && row.h1;
                      const missingParts: string[] = [];
                      if (!row.title) missingParts.push("title");
                      if (!row.meta) missingParts.push("meta description");
                      if (!row.h1) missingParts.push("H1");

                      const suggestion = isOptimised 
                        ? "All optimised" 
                        : `Add '${row.topQuery}' to ${missingParts.join(" and ")}.`;

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 18px", color: "#334155", fontWeight: "500", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.page || "/"}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: "#EFF6FF", color: "#2563EB", padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>
                              {row.topQuery}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748B" }}>
                            {row.impressions.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#0F172A", fontWeight: "700" }}>
                            {row.position.toFixed(1)}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {row.title ? <Check size={14} color="#16A34A" /> : <X size={14} color="#DC2626" />}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {row.meta ? <Check size={14} color="#16A34A" /> : <X size={14} color="#DC2626" />}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {row.h1 ? <Check size={14} color="#16A34A" /> : <X size={14} color="#DC2626" />}
                          </td>
                          <td style={{ padding: "12px 18px", color: isOptimised ? "#16A34A" : "#334155", fontWeight: isOptimised ? "700" : "400" }}>
                            {suggestion}
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "center" }}>
                            <button style={{ padding: "3px 10px", background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", fontSize: "11px", color: "#475569", cursor: "pointer" }}>
                              Send
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
