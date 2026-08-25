"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  AlertCircle, 
  RefreshCw,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import styles from "@/styles/ClientCard.module.css";
import { ClientDashboardCard } from "@/services/dashboardService";
import { DeliveryDetail } from "@/services/deliveryService";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, Tooltip, Dot } from "recharts";

interface ClientCardProps {
  client: ClientDashboardCard;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
}

export default function ClientCard({ client, onEdit, onView }: ClientCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Determine what metric to plot in sparkline
  const hasDataToPlot = client.hasGA4 || client.hasGSC;
  const dataKey = client.hasGA4 ? "sessions" : "organicTraffic";
  const metricsLabel = client.hasGA4 ? "Organic Sessions" : "Organic Clicks";

  // Prepare Recharts Data
  const { current, previous } = client.history;
  
  const chartData = current.map((currData, idx) => {
    const prevData = previous[idx] || { [dataKey]: 0 };
    
    // Find if there's a delivery event on this date
    const delivery = client.deliveries.find(d => d.date === currData.date);
    
    return {
      date: currData.date,
      displayDate: new Date(currData.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
      currentVal: currData[dataKey] || 0,
      prevVal: prevData[dataKey] || 0,
      delivery
    };
  });

  const numBacklinks = client.deliveries.filter(d => d.type === "BACKLINK").length;
  const numContent = client.deliveries.filter(d => d.type === "CONTENT").length;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.delivery) return null;
    
    const isLink = payload.delivery.type === "BACKLINK";
    
    if (isLink) {
      // Draw orange diamond
      return (
        <svg x={cx - 5} y={cy - 5} width={10} height={10} viewBox="0 0 10 10">
          <polygon points="5,0 10,5 5,10 0,5" fill="#f97316" stroke="white" strokeWidth="1"/>
        </svg>
      );
    } else {
      // Draw purple circle
      return (
        <circle cx={cx} cy={cy} r={4} fill="#8b5cf6" stroke="white" strokeWidth="1" />
      );
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: "#1F2937", color: "white", padding: "12px", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", border: "none", zIndex: 10 }}>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>{data.displayDate}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: "8px", height: "8px", background: "#3B82F6", borderRadius: "2px" }}></div>
            {metricsLabel}: {formatNumber(data.currentVal)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", background: "#94A3B8", borderRadius: "2px" }}></div>
            Prev Period: {formatNumber(data.prevVal)}
          </div>
          {data.delivery && (
            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #374151", color: data.delivery.type === "BACKLINK" ? "#f97316" : "#8b5cf6", fontWeight: "600" }}>
              {data.delivery.type === "BACKLINK" ? "♦ Backlink Placed" : "● Content Published"}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Determine Badge Classes & Titles based on connections
  const getBadgeStyle = (provider: "GA4" | "GSC", status: string, errorMsg: string | null) => {
    if (status === "CONNECTED") {
      return {
        className: provider === "GA4" ? styles.sourceBadge + " " + styles.ga4 : styles.sourceBadge + " " + styles.gsc,
        label: `${provider} Connected`
      };
    }
    if (status === "SYNC_ERROR") {
      return {
        className: styles.sourceBadge,
        label: `${provider} Sync Error`,
        style: {
          background: "var(--error-bg)",
          color: "var(--error)",
          borderColor: "rgba(239, 68, 68, 0.2)"
        }
      };
    }
    return {
      className: styles.sourceBadge,
      label: `${provider} Disconnected`,
      style: {
        background: "rgba(255, 255, 255, 0.02)",
        color: "var(--text-muted)",
        borderColor: "var(--border-color)"
      }
    };
  };

  const ga4Badge = getBadgeStyle("GA4", client.ga4Status, client.ga4Error);
  const gscBadge = getBadgeStyle("GSC", client.gscStatus, client.gscError);

  return (
    <div className={styles.clientCard} style={{ background: "white", padding: "0" }}>
      {/* Header */}
      <div className={styles.cardHeader} style={{ padding: "20px 24px 0 24px" }}>
        <div className={styles.clientMeta}>
          <div className={styles.logo}>{client.initials}</div>
          <div className={styles.clientDetails}>
            <span className={styles.clientName}>{client.name}</span>
            <a 
              href={`https://${client.domain}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.clientDomain}
            >
              {client.domain}
            </a>
          </div>
        </div>

        <div className={styles.headerBadges}>
          {client.isArchived && (
            <span className={`${styles.statusBadge} ${styles.archived}`}>Archived</span>
          )}
          <div className={styles.sourceBadges}>
            <span 
              className={ga4Badge.className} 
              style={ga4Badge.style}
              title={client.ga4Status === "SYNC_ERROR" && client.ga4Error ? client.ga4Error : ga4Badge.label}
            >
              GA4
            </span>
            <span 
              className={gscBadge.className} 
              style={gscBadge.style}
              title={gscBadge.label}
            >
              GSC
            </span>
            <button 
              onClick={() => onEdit(client.id)}
              className={styles.actionBtn}
              style={{ marginLeft: "8px" }}
            >
              <Edit2 size={12} /> Edit
            </button>
            <Link 
              href={`/admin/clients/${client.id}`}
              className={styles.actionBtn}
            >
              <ArrowUpRight size={12} /> View
            </Link>
          </div>
        </div>
      </div>

      {client.ga4Status === "SYNC_ERROR" && client.ga4Error && (
        <div style={{ margin: "16px 24px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.75rem", color: "var(--error)" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <strong>Sync Failure:</strong> {client.ga4Error}
          </span>
        </div>
      )}

      {hasDataToPlot && client.metrics ? (
        <>
          <div style={{ height: "130px", width: "100%", marginTop: "16px", padding: "0 10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 8 }}>
                <defs>
                  <linearGradient id={`grad-${client.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E7490" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#0E7490" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" hide />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                {/* Previous Period */}
                <Line 
                  type="monotone" 
                  dataKey="prevVal" 
                  stroke="#CBD5E1" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
                
                {/* Current Period */}
                <Area 
                  type="monotone" 
                  dataKey="currentVal" 
                  stroke="#0E7490" 
                  strokeWidth={2}
                  fill={`url(#grad-${client.id})`}
                  dot={<CustomDot />}
                  activeDot={{ r: 6, fill: '#0E7490', stroke: 'white', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ padding: "0 24px", display: "flex", gap: "16px", alignItems: "center", fontSize: "11px", color: "#64748B", marginTop: "-4px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "3px", background: "#0E7490", borderRadius: "1px" }}></div> Current</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "2px", borderTop: "2px dashed #CBD5E1" }}></div> Prev period</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width={8} height={8} viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill="#f97316" /></svg>
              {numBacklinks} backlinks placed
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width={8} height={8} viewBox="0 0 8 8"><circle cx={4} cy={4} r={4} fill="#8b5cf6" /></svg>
              {numContent} content posts
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "16px 24px", borderTop: "1px solid #E2E8F0" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.5px", marginBottom: "4px" }}>SESSIONS</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>{formatNumber(client.metrics.sessions)}</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: client.metrics.sessionsChange >= 0 ? "#10B981" : "#EF4444" }}>
                {client.metrics.sessionsChange >= 0 ? "↑" : "↓"} {Math.abs(client.metrics.sessionsChange)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.5px", marginBottom: "4px" }}>ORGANIC</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>{formatNumber(client.metrics.organicTraffic)}</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: client.metrics.organicTrafficChange >= 0 ? "#10B981" : "#EF4444" }}>
                {client.metrics.organicTrafficChange >= 0 ? "↑" : "↓"} {Math.abs(client.metrics.organicTrafficChange)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.5px", marginBottom: "4px", whiteSpace: "nowrap" }}>CONVERSIONS</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>{formatNumber(client.metrics.conversions)}</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: client.metrics.conversionsChange >= 0 ? "#10B981" : "#EF4444" }}>
                {client.metrics.conversionsChange >= 0 ? "↑" : "↓"} {Math.abs(client.metrics.conversionsChange)}%
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.unconnectedPanel} style={{ height: "135px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={16} style={{ color: "var(--text-muted)" }} />
              <span className={styles.unconnectedText} style={{ fontWeight: 600 }}>Analytics Not Connected</span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "260px", lineHeight: 1.4 }}>
                Connect GA4 or GSC to fetch search console clicks and traffic conversion data.
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <Link href={`/admin/clients/${client.id}`} className={styles.btnConnect}>Connect GA4</Link>
              <Link href={`/admin/clients/${client.id}`} className={styles.btnConnect}>Connect GSC</Link>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", padding: "16px 24px", borderTop: "1px solid #E2E8F0", opacity: 0.5 }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.5px", marginBottom: "4px" }}>SESSIONS</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>-</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8" }}>-</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.5px", marginBottom: "4px" }}>ORGANIC</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>-</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8" }}>-</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: "600", color: "#94A3B8", letterSpacing: "0.5px", marginBottom: "4px", whiteSpace: "nowrap" }}>CONVERSIONS</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>-</div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94A3B8" }}>-</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
