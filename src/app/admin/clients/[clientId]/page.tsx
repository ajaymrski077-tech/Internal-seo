"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Settings,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Play,
  Trash2
} from "lucide-react";
import styles from "@/styles/ClientWorkspace.module.css";
import { useToast } from "@/components/ToastContext";
import { useConfirm } from "@/components/ConfirmContext";
import ClientModal from "@/components/ClientModal";

// Local Interfaces
interface ConnectionDetail {
  id: string | number;
  provider: string;
  status: string;
  syncStatus: string | null;
  syncError: string | null;
  lastSyncTime: string | null;
  externalId: string | null;
  conversionEventName: string | null;
}

interface PropertyDetail {
  id: string | number;
  domain: string;
  name: string;
  connections: ConnectionDetail[];
}

interface ClientDetail {
  id: string | number;
  name: string;
  companyName: string | null;
  logoUrl: string | null;
  status: string;
  isArchived: boolean;
  shareToken: string | null;
  managerName: string | null;
  notes: string | null;
  startDate: string | null;
  createdAt: string;
  properties: PropertyDetail[];
}

interface DeliveryDetail {
  id: string | number;
  clientId: string | number;
  clientName: string;
  propertyId: string | number | null;
  propertyDomain: string | null;
  type: string; // BACKLINK, CONTENT
  date: string;
  description: string;
  contentDetails?: {
    title: string;
    url: string;
    wordCount: number;
  } | null;
  linkDetails?: {
    url: string;
    anchorText: string;
    targetUrl: string;
    domainAuthority: number;
  } | null;
}

interface WorkspacePayload {
  client: ClientDetail;
  domain: string;
  initials: string;
  ga4Status: string;
  gscStatus: string;
  gbpStatus: string;
  ga4Error: string | null;
  gscError: string | null;
  gbpError: string | null;
  lastSyncTime: string | null;
  metrics: {
    sessions: number;
    organicTraffic: number;
    conversions: number;
    sessionsChange: number;
    organicTrafficChange: number;
    conversionsChange: number;
  } | null;
  totalUsers?: number;
  totalUsersChange?: number;
  channels?: {
    organicSearch: number;
    direct: number;
    referral: number;
    paidSearch: number;
    social: number;
    email: number;
    other: number;
  };
  aiReferralTraffic?: {
    totalSessions: number;
    sources: Array<{ name: string; sessions: number; percentage: number }>;
  };
  history: {
    current: Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }>;
    previous: Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }>;
  };
  deliveries: DeliveryDetail[];
}

export default function ClientWorkspacePage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  // Range and Tab States
  const [range, setRange] = useState("30d"); // 7d, 30d, 60d, 90d
  const [activeTab, setActiveTab] = useState<"overview" | "channels" | "integrations">("overview");

  // Integrations state
  const [ga4Id, setGa4Id] = useState("");
  const [ga4Event, setGa4Event] = useState("");
  const [gscId, setGscId] = useState("");
  const [gbpId, setGbpId] = useState("");
  const [savingConn, setSavingConn] = useState<string | null>(null);
  const [syncingConn, setSyncingConn] = useState<string | null>(null);

  // Discovered properties list
  const [discoveredGa4, setDiscoveredGa4] = useState<any[]>([]);
  const [discoveredGsc, setDiscoveredGsc] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState<string | null>(null);

  // Core Data States
  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Popups
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hoveredHistoryIndex, setHoveredHistoryIndex] = useState<number | null>(null);
  const [hoveredDonutKey, setHoveredDonutKey] = useState<string | null>(null);

  const { toast, success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  // Fetch unified workspace data
  const fetchWorkspace = useCallback(async () => {
    if (!clientId || clientId.trim() === "" || clientId === "invalid-id") return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/workspace?range=${range}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404) {
          throw new Error(errorData.error || "Client not found.");
        }
        throw new Error(errorData.error || "Failed to load client workspace.");
      }
      const payload: WorkspacePayload = await res.json();
      setData(payload);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  }, [clientId, range, router]);

  // Pre-populate connection fields when data is fetched
  useEffect(() => {
    if (data?.client?.properties?.[0]?.connections) {
      const conns = data.client.properties[0].connections;
      const ga4 = conns.find((c: any) => c.provider === "GA4");
      const gsc = conns.find((c: any) => c.provider === "GSC");
      const gbp = conns.find((c: any) => c.provider === "GBP");
      if (ga4) {
        setGa4Id(ga4.externalId || "");
        setGa4Event(ga4.conversionEventName || "");
      }
      if (gsc) {
        setGscId(gsc.externalId || "");
      }
      if (gbp) {
        setGbpId(gbp.externalId || "");
      }
    }
  }, [data]);

  const handleSaveConnection = async (provider: string, externalId: string, extra: Record<string, any> = {}) => {
    if (!externalId.trim()) {
      toastError(`Please enter or select a valid ID for ${provider}`);
      return;
    }
    setSavingConn(provider);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          externalId: externalId.trim(),
          status: "CONNECTED",
          ...extra
        })
      });
      const resData = await res.json();
      if (res.ok) {
        success(`${provider} connection saved successfully.`);
        fetchWorkspace();
      } else {
        toastError(resData.error || `Failed to save ${provider} connection.`);
      }
    } catch (err) {
      console.error(err);
      toastError(`Failed to save ${provider} connection.`);
    } finally {
      setSavingConn(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    setSavingConn(provider);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections?provider=${provider}`, {
        method: "DELETE"
      });
      const resData = await res.json();
      if (res.ok) {
        success(`${provider} disconnected successfully.`);
        if (provider === "GA4") { setGa4Id(""); setDiscoveredGa4([]); }
        if (provider === "GSC") { setGscId(""); setDiscoveredGsc([]); }
        if (provider === "GBP") { setGbpId(""); }
        fetchWorkspace();
      } else {
        toastError(resData.error || `Failed to disconnect ${provider}.`);
      }
    } catch (err) {
      console.error(err);
      toastError(`Failed to disconnect ${provider}.`);
    } finally {
      setSavingConn(null);
    }
  };

  const handleSyncData = async (provider: string) => {
    setSyncingConn(provider);
    try {
      const res = await fetch(`/api/clients/${clientId}/sync`, {
        method: "POST"
      });
      const resData = await res.json();
      if (res.ok) {
        success("Synchronization completed successfully.");
        fetchWorkspace();
      } else {
        toastError(resData.error || "Failed to trigger synchronization.");
      }
    } catch (err) {
      console.error(err);
      toastError("Failed to trigger synchronization.");
    } finally {
      setSyncingConn(null);
    }
  };

  const handleDiscover = async (provider: string) => {
    setDiscovering(provider);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections/discover-${provider.toLowerCase()}`);
      const resData = await res.json();
      if (res.ok) {
        if (provider === "GA4") {
          setDiscoveredGa4(resData.properties || []);
          if (resData.properties?.length > 0) {
            setGa4Id(resData.properties[0].propertyId);
          }
        } else if (provider === "GSC") {
          setDiscoveredGsc(resData.sites || []);
          if (resData.sites?.length > 0) {
            setGscId(resData.sites[0].siteUrl);
          }
        }
        success(`Discovered available ${provider} properties successfully.`);
      } else {
        toastError(resData.error || `Failed to fetch available ${provider} properties.`);
      }
    } catch (err) {
      console.error(err);
      toastError(`Failed to discover ${provider} properties.`);
    } finally {
      setDiscovering(null);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Merge daily deliveries into history points
  const historyWithDeliveries = useMemo(() => {
    if (!data?.history?.current) return [];
    const deliveries = data.deliveries || [];

    return data.history.current.map((h) => {
      const hDate = h.date.split("T")[0];
      const matchedDeliveries = deliveries.filter((d) => d.date.split("T")[0] === hDate);
      return {
        ...h,
        deliveries: matchedDeliveries
      };
    });
  }, [data?.history?.current, data?.deliveries]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px" }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <AlertCircle size={36} style={{ color: "var(--error)" }} />
          <h3>Workspace Load Error</h3>
          <p>{error || "The requested client does not exist or you do not have permission to view it."}</p>
          <Link href="/admin/clients" className={styles.btnBack}>
            <ArrowLeft size={14} />
            Back to Clients List
          </Link>
        </div>
      </div>
    );
  }

  const { client, domain, metrics, totalUsers, totalUsersChange, channels, aiReferralTraffic, deliveries } = data;

  // -------------------------------------------------------------
  // RENDER DUAL-LINE SPLINE CHART (Traffic Over Time)
  // -------------------------------------------------------------
  const renderTrafficOverTimeChart = () => {
    const hist = historyWithDeliveries;
    if (hist.length < 2) {
      return (
        <div className={styles.noChartData}>
          Insufficient data points to plot timeline trend.
        </div>
      );
    }

    const totalSessionsVals = hist.map((h) => h.sessions || 0);
    const organicSessionsVals = hist.map((h) => h.organicTraffic || 0);
    const rawMax = Math.max(...totalSessionsVals, ...organicSessionsVals, 0);
    const maxVal = rawMax > 0 ? Math.ceil(rawMax * 1.25) : 10;
    const minVal = 0;

    const width = 1000;
    const chartHeight = 280;
    const paddingLeft = 45;
    const paddingRight = 25;
    const paddingTop = 25;
    const paddingBottom = 40;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;
    const stepX = plotWidth / (hist.length - 1);

    const getY = (val: number) => {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      return paddingTop + plotHeight - ((clamped - minVal) / (maxVal - minVal)) * plotHeight;
    };

    const getX = (idx: number) => {
      return paddingLeft + idx * stepX;
    };

    // Calculate spline curve path (Catmull-Rom / Bezier approximation)
    const getSplinePath = (vals: number[]) => {
      const pts = vals.map((v, i) => ({ x: getX(i), y: getY(v) }));
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
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

    const totalLinePath = getSplinePath(totalSessionsVals);
    const organicLinePath = getSplinePath(organicSessionsVals);

    const totalAreaPath = `${totalLinePath} L ${width - paddingRight},${paddingTop + plotHeight} L ${paddingLeft},${paddingTop + plotHeight} Z`;
    const organicAreaPath = `${organicLinePath} L ${width - paddingRight},${paddingTop + plotHeight} L ${paddingLeft},${paddingTop + plotHeight} Z`;

    // 5-6 date label indices along X-axis
    const labelStep = Math.max(1, Math.floor((hist.length - 1) / 7));
    const labelIndices: number[] = [];
    for (let i = 0; i < hist.length; i += labelStep) {
      labelIndices.push(i);
    }
    if (labelIndices[labelIndices.length - 1] !== hist.length - 1) {
      labelIndices.push(hist.length - 1);
    }

    const hoveredPoint = hoveredHistoryIndex !== null && hist[hoveredHistoryIndex] ? hist[hoveredHistoryIndex] : null;
    const hoveredX = hoveredHistoryIndex !== null ? getX(hoveredHistoryIndex) : 0;

    return (
      <div
        className={styles.chartContainer}
        style={{ height: `${chartHeight}px`, position: "relative", userSelect: "none" }}
        onMouseLeave={() => setHoveredHistoryIndex(null)}
      >
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${width} ${chartHeight}`}
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const relativeX = mouseX - paddingLeft;
            const clampedX = Math.max(0, Math.min(plotWidth, relativeX));
            const nearestIdx = Math.round(clampedX / stepX);
            if (nearestIdx >= 0 && nearestIdx < hist.length) {
              setHoveredHistoryIndex(nearestIdx);
            }
          }}
        >
          <defs>
            <linearGradient id="totalSessionsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F4C5C" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F4C5C" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="organicSessionsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + plotHeight * pct;
            const val = Math.round(maxVal * (1 - pct));
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94A3B8"
                  fontFamily="system-ui, sans-serif"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={totalAreaPath} fill="url(#totalSessionsGrad)" />
          <path d={organicAreaPath} fill="url(#organicSessionsGrad)" />

          {/* Spline Lines */}
          <path d={totalLinePath} fill="none" stroke="#0F4C5C" strokeWidth="2.5" />
          <path d={organicLinePath} fill="none" stroke="#2563EB" strokeWidth="2.25" />

          {/* Milestone Delivery Event Markers */}
          {hist.map((pt, idx) => {
            if (!pt.deliveries || pt.deliveries.length === 0) return null;
            const x = getX(idx);
            const y = getY(pt.sessions || 0);

            return pt.deliveries.map((del, dIdx) => {
              const isBacklink = del.type === "BACKLINK";
              return isBacklink ? (
                <g key={`${idx}-${dIdx}`}>
                  {/* Orange Diamond for Backlink */}
                  <polygon
                    points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`}
                    fill="#F97316"
                    stroke="#FFFFFF"
                    strokeWidth="1.75"
                    style={{ cursor: "pointer" }}
                  />
                </g>
              ) : (
                <g key={`${idx}-${dIdx}`}>
                  {/* Purple Diamond/Circle for Content */}
                  <polygon
                    points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`}
                    fill="#8B5CF6"
                    stroke="#FFFFFF"
                    strokeWidth="1.75"
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            });
          })}

          {/* X-axis Date Labels */}
          {labelIndices.map((idx) => {
            const pt = hist[idx];
            if (!pt) return null;
            const x = getX(idx);
            const d = new Date(pt.date);
            const label = isNaN(d.getTime()) ? pt.date : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return (
              <text
                key={idx}
                x={x}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#94A3B8"
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            );
          })}

          {/* Interactive Hover Crosshair */}
          {hoveredHistoryIndex !== null && (
            <g>
              <line
                x1={hoveredX}
                y1={paddingTop}
                x2={hoveredX}
                y2={paddingTop + plotHeight}
                stroke="#64748B"
                strokeWidth="1.25"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredX}
                cy={getY(hist[hoveredHistoryIndex]?.sessions || 0)}
                r="4.5"
                fill="#0F4C5C"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle
                cx={hoveredX}
                cy={getY(hist[hoveredHistoryIndex]?.organicTraffic || 0)}
                r="4.5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              left: `${(Math.min(Math.max(hoveredX, 90), width - 130) / width) * 100}%`,
              top: "10px",
              transform: "translateX(-50%)",
              background: "#0F172A",
              color: "#FFFFFF",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.775rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "170px"
            }}
          >
            <div style={{ fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "4px", marginBottom: "2px" }}>
              {new Date(hoveredPoint.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#38BDF8", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0F4C5C", border: "1px solid #38BDF8", display: "inline-block" }}></span>
                Total Sessions:
              </span>
              <strong style={{ fontSize: "0.85rem" }}>{(hoveredPoint.sessions || 0).toLocaleString()}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#60A5FA", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", display: "inline-block" }}></span>
                Organic Sessions:
              </span>
              <strong style={{ fontSize: "0.85rem" }}>{(hoveredPoint.organicTraffic || 0).toLocaleString()}</strong>
            </div>

            {/* Delivery Event details */}
            {hoveredPoint.deliveries && hoveredPoint.deliveries.length > 0 && (
              <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", gap: "2px" }}>
                {hoveredPoint.deliveries.map((del, dIdx) => (
                  <div key={dIdx} style={{ fontSize: "0.725rem", color: del.type === "BACKLINK" ? "#F97316" : "#A78BFA", fontWeight: "600" }}>
                    {del.type === "BACKLINK" ? "◆ Backlink: " : "● Content: "}
                    <span style={{ color: "#FFFFFF", fontWeight: "400" }}>
                      {del.linkDetails?.anchorText || del.contentDetails?.title || del.description || "Milestone achieved"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER DONUT CHART (Channels Distribution)
  // -------------------------------------------------------------
  const renderChannelDonutChart = () => {
    const channelData = [
      { key: "organicSearch", label: "Organic Search", value: channels?.organicSearch ?? 0, color: "#0D9488" },
      { key: "direct", label: "Direct", value: channels?.direct ?? 0, color: "#2563EB" },
      { key: "referral", label: "Referral", value: channels?.referral ?? 0, color: "#8B5CF6" },
      { key: "paidSearch", label: "Paid Search", value: channels?.paidSearch ?? 0, color: "#F59E0B" },
      { key: "social", label: "Social", value: channels?.social ?? 0, color: "#EC4899" },
      { key: "email", label: "Email", value: channels?.email ?? 0, color: "#06B6D4" },
      { key: "other", label: "Other", value: channels?.other ?? 0, color: "#64748B" }
    ];

    const totalVal = channelData.reduce((acc, c) => acc + c.value, 0);

    // Calculate arc paths for donut
    const size = 260;
    const center = size / 2;
    const outerRadius = 110;
    const innerRadius = 70;

    let accumulatedAngle = -90; // Start at 12 o'clock

    const slices = channelData.map((c) => {
      const sliceAngle = totalVal > 0 ? (c.value / totalVal) * 360 : 0;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + outerRadius * Math.cos(startRad);
      const y1 = center + outerRadius * Math.sin(startRad);
      const x2 = center + outerRadius * Math.cos(endRad);
      const y2 = center + outerRadius * Math.sin(endRad);

      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = totalVal > 0 && sliceAngle > 0
        ? `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
        : "";

      const percentage = totalVal > 0 ? ((c.value / totalVal) * 100).toFixed(1) : "0.0";

      return {
        ...c,
        pathData,
        percentage
      };
    });

    return (
      <div className={styles.donutWrapper}>
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {totalVal === 0 ? (
              <circle
                cx={center}
                cy={center}
                r={(outerRadius + innerRadius) / 2}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={outerRadius - innerRadius}
              />
            ) : (
              slices.map((s) => s.pathData && (
                <path
                  key={s.key}
                  d={s.pathData}
                  fill={s.color}
                  opacity={hoveredDonutKey === null || hoveredDonutKey === s.key ? 1 : 0.4}
                  style={{ cursor: "pointer", transition: "opacity 0.2s ease" }}
                  onMouseEnter={() => setHoveredDonutKey(s.key)}
                  onMouseLeave={() => setHoveredDonutKey(null)}
                />
              ))
            )}
          </svg>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}
          >
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0F172A" }}>
              {totalVal.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>
              Sessions
            </div>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className={styles.donutLegendList}>
          {channelData.map((c) => {
            const pct = totalVal > 0 ? ((c.value / totalVal) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={c.key}
                className={styles.donutLegendRow}
                style={{
                  cursor: "pointer",
                  opacity: hoveredDonutKey === null || hoveredDonutKey === c.key ? 1 : 0.4,
                  transition: "opacity 0.2s ease"
                }}
                onMouseEnter={() => setHoveredDonutKey(c.key)}
                onMouseLeave={() => setHoveredDonutKey(null)}
              >
                <div style={{ width: 10, height: 10, borderRadius: "2px", background: c.color }} />
                <span style={{ width: "110px", fontSize: "0.8125rem", color: "#475569" }}>{c.label}</span>
                <strong style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{c.value.toLocaleString()}</strong>
                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 1. BACK TO DASHBOARD BREADCRUMB */}
      <div>
        <Link href="/admin" className={styles.btnBack}>
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>

      {/* 2. CLIENT TITLE & HEADER */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.clientName}>{client.name}</h1>
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.domainLink}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            https://{domain}/
            <ExternalLink size={13} />
          </a>
        </div>

        <div>
          <button
            className={styles.btnBack}
            onClick={() => setIsEditModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>

      {/* 3. DATE RANGE FILTER PILLS */}
      <div className={styles.rangePillsContainer}>
        {[
          { id: "7d", label: "Last 7 days" },
          { id: "30d", label: "Last 30 days" },
          { id: "60d", label: "Last 60 days" },
          { id: "90d", label: "Last 90 days" }
        ].map((r) => (
          <button
            key={r.id}
            className={`${styles.rangePill} ${range === r.id ? styles.rangePillActive : ""}`}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 4. SUB TABS: OVERVIEW | CHANNELS | INTEGRATIONS */}
      <div className={styles.subTabsRow}>
        <button
          className={`${styles.subTabBtn} ${activeTab === "overview" ? styles.subTabBtnActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`${styles.subTabBtn} ${activeTab === "channels" ? styles.subTabBtnActive : ""}`}
          onClick={() => setActiveTab("channels")}
        >
          Channels
        </button>
        <button
          className={`${styles.subTabBtn} ${activeTab === "integrations" ? styles.subTabBtnActive : ""}`}
          onClick={() => setActiveTab("integrations")}
        >
          Integrations
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ============================================================= */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 4 KPI CARDS GRID */}
          <div className={styles.metricsGrid}>
            {/* 1. TOTAL SESSIONS */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Sessions</span>
              <span className={styles.metricVal}>
                {(metrics?.sessions ?? 0).toLocaleString()}
              </span>
              <div className={styles.metricTrendRow}>
                {metrics && (
                  <span className={`${styles.trendBadge} ${(metrics.sessionsChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                    {(metrics.sessionsChange ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {(metrics.sessionsChange ?? 0) >= 0 ? "+" : ""}{(metrics.sessionsChange ?? 0).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* 2. ORGANIC SESSIONS */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Organic Sessions</span>
              <span className={styles.metricVal}>
                {(metrics?.organicTraffic ?? 0).toLocaleString()}
              </span>
              <div className={styles.metricTrendRow}>
                {metrics && (
                  <span className={`${styles.trendBadge} ${(metrics.organicTrafficChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                    {(metrics.organicTrafficChange ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {(metrics.organicTrafficChange ?? 0) >= 0 ? "+" : ""}{(metrics.organicTrafficChange ?? 0).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* 3. TOTAL USERS */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Users</span>
              <span className={styles.metricVal}>
                {(totalUsers ?? Math.round((metrics?.sessions ?? 0) * 0.92)).toLocaleString()}
              </span>
              <div className={styles.metricTrendRow}>
                {metrics && (
                  <span className={`${styles.trendBadge} ${(totalUsersChange ?? metrics.sessionsChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                    {(totalUsersChange ?? metrics.sessionsChange ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {(totalUsersChange ?? metrics.sessionsChange ?? 0) >= 0 ? "+" : ""}{(totalUsersChange ?? metrics.sessionsChange ?? 0).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* 4. CONVERSIONS */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Conversions</span>
              <span className={styles.metricVal}>
                {(metrics?.conversions ?? 0).toLocaleString()}
              </span>
              <div className={styles.metricTrendRow}>
                {metrics && metrics.conversionsChange !== 0 ? (
                  <span className={`${styles.trendBadge} ${(metrics.conversionsChange ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                    {(metrics.conversionsChange ?? 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {(metrics.conversionsChange ?? 0) >= 0 ? "+" : ""}{(metrics.conversionsChange ?? 0).toFixed(1)}%
                  </span>
                ) : (
                  <span className={styles.trendPeriod}>—</span>
                )}
              </div>
            </div>
          </div>

          {/* TRAFFIC OVER TIME CARD */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeaderFlex}>
              <span className={styles.cardMainTitle}>Traffic Over Time</span>
              <span className={styles.cardSubNote}>Data source: Google Analytics 4</span>
            </div>

            {/* Legend row */}
            <div className={styles.chartLegendFlex}>
              <div className={styles.legendPillItem}>
                <div style={{ width: 12, height: 12, borderRadius: "2px", background: "#0F4C5C" }} />
                <span>Total Sessions</span>
              </div>
              <div className={styles.legendPillItem}>
                <div style={{ width: 12, height: 12, borderRadius: "2px", background: "#2563EB" }} />
                <span>Organic Sessions</span>
              </div>
              <div className={styles.legendPillItem}>
                <div style={{ width: 10, height: 10, transform: "rotate(45deg)", background: "#F97316" }} />
                <span>Backlink placed</span>
              </div>
              <div className={styles.legendPillItem}>
                <div style={{ width: 10, height: 10, transform: "rotate(45deg)", background: "#8B5CF6" }} />
                <span>Content posted</span>
              </div>
            </div>

            {/* Interactive Timeline Spline Chart */}
            {renderTrafficOverTimeChart()}
          </div>

          {/* AI REFERRAL TRAFFIC CARD */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeaderFlex}>
              <span className={styles.cardMainTitle}>AI Referral Traffic</span>
              <span className={styles.cardSubNote}>Sessions from AI/LLM sources</span>
            </div>

            {aiReferralTraffic && aiReferralTraffic.totalSessions > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {aiReferralTraffic.sources.map((s, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                    <span style={{ fontWeight: "600", color: "#0F172A" }}>{s.name}</span>
                    <span style={{ color: "#475569" }}>{s.sessions.toLocaleString()} sessions ({s.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "8px 0" }}>
                No AI referral traffic in this period
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: CHANNELS */}
      {/* ============================================================= */}
      {activeTab === "channels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* SESSIONS BY CHANNEL STRIP */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeaderFlex} style={{ marginBottom: "8px" }}>
              <span className={styles.cardMainTitle}>Sessions by Channel</span>
            </div>

            <div className={styles.channelGridRow}>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Organic Search</span>
                <span className={styles.channelValText}>{(channels?.organicSearch ?? 0).toLocaleString()}</span>
              </div>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Direct</span>
                <span className={styles.channelValText}>{(channels?.direct ?? 0).toLocaleString()}</span>
              </div>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Referral</span>
                <span className={styles.channelValText}>{(channels?.referral ?? 0).toLocaleString()}</span>
              </div>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Paid Search</span>
                <span className={styles.channelValText}>{(channels?.paidSearch ?? 0).toLocaleString()}</span>
              </div>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Social</span>
                <span className={styles.channelValText}>{(channels?.social ?? 0).toLocaleString()}</span>
              </div>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Email</span>
                <span className={styles.channelValText}>{(channels?.email ?? 0).toLocaleString()}</span>
              </div>
              <div className={styles.channelGridCol}>
                <span className={styles.channelLabelText}>Other</span>
                <span className={styles.channelValText}>{(channels?.other ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* CHANNEL DISTRIBUTION DONUT CHART */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeaderFlex}>
              <span className={styles.cardMainTitle}>Channel Distribution</span>
            </div>

            {renderChannelDonutChart()}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: INTEGRATIONS */}
      {/* ============================================================= */}
      {activeTab === "integrations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Main Info Card */}
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "0 0 6px 0" }}>Manual Integration Connections</h2>
            <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: "1.5" }}>
              Connect this client's workspace properties manually to GSC, GA4, or GBP. 
              Clicking "Sign in with Google" will redirect you to Google's secure authentication screen to authorize tokens.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
            
            {/* 1. GOOGLE SEARCH CONSOLE (GSC) */}
            {(() => {
              const conns = data?.client?.properties?.[0]?.connections || [];
              const conn = conns.find((c: any) => c.provider === "GSC");
              const isConnected = !!conn;

              return (
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "360px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>Google Search Console</h3>
                        <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "600" }}>GSC Connection</span>
                      </div>
                      
                      {/* Status Badge */}
                      {isConnected ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: conn.status === "CONNECTED" ? "#F0FDF4" : "#FEF2F2",
                          color: conn.status === "CONNECTED" ? "#166534" : "#991B1B",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          <CheckCircle size={10} /> Connected
                        </span>
                      ) : (
                        <span style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          Not Configured
                        </span>
                      )}
                    </div>

                    {/* Connection details */}
                    {isConnected && (
                      <div style={{ fontSize: "12px", color: "#64748B", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                        <div><strong>Connected Site URL:</strong> <code style={{ color: "#0F172A" }}>{conn.externalId || "Not set"}</code></div>
                        <div><strong>Sync Status:</strong> {conn.syncStatus || "PENDING"}</div>
                        {conn.syncError && <div style={{ color: "#DC2626" }}><strong>Sync Error:</strong> {conn.syncError}</div>}
                        {conn.lastSyncTime && <div><strong>Last Sync:</strong> {new Date(conn.lastSyncTime).toLocaleString()}</div>}
                      </div>
                    )}

                    {/* Config inputs */}
                    {isConnected ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Select GSC Site URL</label>
                        {discoveredGsc.length > 0 ? (
                          <select
                            value={gscId}
                            onChange={(e) => setGscId(e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white" }}
                          >
                            {discoveredGsc.map((s) => (
                              <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl} ({s.permissionLevel})</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              type="text"
                              placeholder="e.g. sc-domain:example.com or https://example.com"
                              value={gscId}
                              onChange={(e) => setGscId(e.target.value)}
                              style={{ flex: 1, padding: "8px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleDiscover("GSC")}
                              disabled={discovering === "GSC"}
                              style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                            >
                              {discovering === "GSC" ? "Loading..." : "Discover"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: "12.5px", color: "#64748B", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                        Authorize this client's Search Console data to begin pulling keyword ranks, impressions, and click history.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {isConnected ? (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleSaveConnection("GSC", gscId)}
                          disabled={savingConn === "GSC"}
                          style={{ flex: 1, background: "#0F4C5C", color: "white", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                        >
                          {savingConn === "GSC" ? "Saving..." : "Save Config"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncData("GSC")}
                          disabled={syncingConn === "GSC"}
                          style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}
                          title="Sync Data"
                        >
                          <RefreshCw size={14} className={syncingConn === "GSC" ? "spin" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect("GSC")}
                          disabled={savingConn === "GSC"}
                          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/api/auth/google?clientId=${clientId}&provider=GSC`}
                        style={{ display: "block", textAlign: "center", background: "#0F4C5C", color: "white", textDecoration: "none", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", fontWeight: "600" }}
                      >
                        Sign in with Google
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. GOOGLE ANALYTICS 4 (GA4) */}
            {(() => {
              const conns = data?.client?.properties?.[0]?.connections || [];
              const conn = conns.find((c: any) => c.provider === "GA4");
              const isConnected = !!conn;

              return (
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", minHeight: "360px", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>Google Analytics 4</h3>
                        <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "600" }}>GA4 Connection</span>
                      </div>
                      
                      {/* Status Badge */}
                      {isConnected ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: conn.status === "CONNECTED" ? "#F0FDF4" : "#FEF2F2",
                          color: conn.status === "CONNECTED" ? "#166534" : "#991B1B",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          <CheckCircle size={10} /> Connected
                        </span>
                      ) : (
                        <span style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          Not Configured
                        </span>
                      )}
                    </div>

                    {/* Connection details */}
                    {isConnected && (
                      <div style={{ fontSize: "12px", color: "#64748B", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                        <div><strong>Property ID:</strong> <code style={{ color: "#0F172A" }}>{conn.externalId || "Not set"}</code></div>
                        {conn.conversionEventName && <div><strong>Conversion Name:</strong> <code style={{ color: "#0F766E" }}>{conn.conversionEventName}</code></div>}
                        <div><strong>Sync Status:</strong> {conn.syncStatus || "PENDING"}</div>
                        {conn.syncError && <div style={{ color: "#DC2626" }}><strong>Sync Error:</strong> {conn.syncError}</div>}
                        {conn.lastSyncTime && <div><strong>Last Sync:</strong> {new Date(conn.lastSyncTime).toLocaleString()}</div>}
                      </div>
                    )}

                    {/* Config inputs */}
                    {isConnected ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Select GA4 Property ID</label>
                          {discoveredGa4.length > 0 ? (
                            <select
                              value={ga4Id}
                              onChange={(e) => setGa4Id(e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white" }}
                            >
                              {discoveredGa4.map((p) => (
                                <option key={p.propertyId} value={p.propertyId}>{p.displayName} ({p.propertyId})</option>
                              ))}
                            </select>
                          ) : (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input
                                type="text"
                                placeholder="e.g. 294029410"
                                value={ga4Id}
                                onChange={(e) => setGa4Id(e.target.value)}
                                style={{ flex: 1, padding: "8px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDiscover("GA4")}
                                disabled={discovering === "GA4"}
                                style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                              >
                                {discovering === "GA4" ? "Loading..." : "Discover"}
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Custom Conversion Event (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. generate_lead or contact_form"
                            value={ga4Event}
                            onChange={(e) => setGa4Event(e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: "12.5px", color: "#64748B", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                        Authorize Google Analytics 4 to track total sessions, user channels, referral charts, and conversion event milestones.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {isConnected ? (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleSaveConnection("GA4", ga4Id, { conversionEventName: ga4Event })}
                          disabled={savingConn === "GA4"}
                          style={{ flex: 1, background: "#0F4C5C", color: "white", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                        >
                          {savingConn === "GA4" ? "Saving..." : "Save Config"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncData("GA4")}
                          disabled={syncingConn === "GA4"}
                          style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}
                          title="Sync Data"
                        >
                          <RefreshCw size={14} className={syncingConn === "GA4" ? "spin" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect("GA4")}
                          disabled={savingConn === "GA4"}
                          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/api/auth/google?clientId=${clientId}&provider=GA4`}
                        style={{ display: "block", textAlign: "center", background: "#0F4C5C", color: "white", textDecoration: "none", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", fontWeight: "600" }}
                      >
                        Sign in with Google
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 3. GOOGLE BUSINESS PROFILE (GBP) */}
            {(() => {
              const conns = data?.client?.properties?.[0]?.connections || [];
              const conn = conns.find((c: any) => c.provider === "GBP");
              const isConnected = !!conn;

              return (
                <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "360px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>Google Business Profile</h3>
                        <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", fontWeight: "600" }}>GBP Connection</span>
                      </div>
                      
                      {/* Status Badge */}
                      {isConnected ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: conn.status === "CONNECTED" ? "#F0FDF4" : "#FEF2F2",
                          color: conn.status === "CONNECTED" ? "#166534" : "#991B1B",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          <CheckCircle size={10} /> Connected
                        </span>
                      ) : (
                        <span style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          Not Configured
                        </span>
                      )}
                    </div>

                    {/* Connection details */}
                    {isConnected && (
                      <div style={{ fontSize: "12px", color: "#64748B", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                        <div><strong>Location ID:</strong> <code style={{ color: "#0F172A" }}>{conn.externalId || "Not set"}</code></div>
                        <div><strong>Sync Status:</strong> {conn.syncStatus || "PENDING"}</div>
                        {conn.syncError && <div style={{ color: "#DC2626" }}><strong>Sync Error:</strong> {conn.syncError}</div>}
                        {conn.lastSyncTime && <div><strong>Last Sync:</strong> {new Date(conn.lastSyncTime).toLocaleString()}</div>}
                      </div>
                    )}

                    {/* Config inputs */}
                    {isConnected ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Enter GBP Location ID</label>
                        <input
                          type="text"
                          placeholder="e.g. locations/123456789"
                          value={gbpId}
                          onChange={(e) => setGbpId(e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", boxSizing: "border-box" }}
                        />
                      </div>
                    ) : (
                      <p style={{ fontSize: "12.5px", color: "#64748B", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                        Link this client's GBP Location ID to pull maps impressions, phone clicks, and directions history onto the scorecard.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {isConnected ? (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleSaveConnection("GBP", gbpId)}
                          disabled={savingConn === "GBP"}
                          style={{ flex: 1, background: "#0F4C5C", color: "white", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                        >
                          {savingConn === "GBP" ? "Saving..." : "Save Config"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncData("GBP")}
                          disabled={syncingConn === "GBP"}
                          style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}
                          title="Sync Data"
                        >
                          <RefreshCw size={14} className={syncingConn === "GBP" ? "spin" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect("GBP")}
                          disabled={savingConn === "GBP"}
                          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/api/auth/google?clientId=${clientId}&provider=GBP`}
                        style={{ display: "block", textAlign: "center", background: "#0F4C5C", color: "white", textDecoration: "none", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", fontWeight: "600" }}
                      >
                        Sign in with Google
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* EDIT / INTEGRATIONS / SETTINGS MODAL */}
      <ClientModal
        clientId={client.id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchWorkspace();
        }}
      />
    </div>
  );
}
