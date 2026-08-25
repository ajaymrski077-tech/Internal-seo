"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  RefreshCw,
  Check,
  AlertTriangle,
  AlertCircle,
  Settings,
  Calendar,
  User,
  Globe,
  Database,
  Shield,
  Activity,
  CheckCircle2,
  MoreVertical,
  Archive,
  RotateCcw,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  FileText,
  Link as LinkIcon,
  ChevronDown,
  Link2
} from "lucide-react";
import styles from "@/styles/ClientWorkspace.module.css";
import { useToast } from "@/components/ToastContext";
import { useConfirm } from "@/components/ConfirmContext";
import { handleApiError } from "@/lib/apiUtils";
import ClientModal from "@/components/ClientModal";

// Local Interfaces
interface ConnectionDetail {
  id: number;
  provider: string;
  status: string;
  syncStatus: string | null;
  syncError: string | null;
  lastSyncTime: string | null;
  externalId: string | null;
  conversionEventName: string | null;
}

interface PropertyDetail {
  id: number;
  domain: string;
  name: string;
  connections: ConnectionDetail[];
}

interface ClientDetail {
  id: number;
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

interface ActivityLog {
  id: number;
  actorEmail: string;
  action: string;
  clientId: number | null;
  clientName: string | null;
  metadata: string | null;
  createdAt: string;
}

interface DeliveryDetail {
  id: number;
  clientId: number;
  clientName: string;
  propertyId: number | null;
  propertyDomain: string | null;
  type: string;
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
  history: {
    current: Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }>;
    previous: Array<{ date: string; sessions: number; organicTraffic: number; conversions: number }>;
  };
  deliveries: DeliveryDetail[];
  activityLogs: ActivityLog[];
  prStats?: {
    activeCampaigns: number;
    totalOutreach: number;
    publishedPlacements: number;
    responseRate: number;
  };
  linkStats?: {
    activeCampaigns: number;
    qualifiedOpportunities: number;
    acquiredLinks: number;
    liveLinks: number;
    attentionLinks: number;
  };
  rankingStats?: {
    trackedKeywords: number;
    averagePosition: number;
    top3Count: number;
    top10Count: number;
    improvedKeywords: number;
    declinedKeywords: number;
  };
  onpageStats?: {
    id: number;
    score: number | null;
    status: string;
    pagesCrawled: number;
    issuesCritical: number;
    createdAt: string;
  } | null;
  gbpStats?: {
    id: number;
    displayName: string;
    primaryCategory: string | null;
    syncStatus: string;
    lastSyncTime: string | null;
    latestMetrics: {
      viewsSearch: number;
      viewsMaps: number;
      clicksWebsite: number;
      clicksCall: number;
      clicksDirections: number;
    } | null;
  } | null;
}

export default function ClientWorkspacePage({ params }: { params: Promise<{ clientId: string }> }) {
  const router = useRouter();
  const { clientId: clientIdStr } = use(params);
  const clientId = parseInt(clientIdStr, 10);

  // Layout Tab State
  const [activeTab, setActiveTab] = useState("overview"); // overview, analytics, integrations, activity, settings
  const [range, setRange] = useState("30d");

  // Core Data States
  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action / Form States
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [overviewEvents, setOverviewEvents] = useState<DeliveryDetail[]>([]);

  const { toast, success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  // Integrations Form values
  const [ga4PropId, setGa4PropId] = useState("");
  const [ga4EventName, setGa4EventName] = useState("");
  const [gscDomainUrl, setGscDomainUrl] = useState("");
  const [isConnectingGA4, setIsConnectingGA4] = useState(false);
  const [isConnectingGSC, setIsConnectingGSC] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Discovered Resources states
  const [discoveredGa4Properties, setDiscoveredGa4Properties] = useState<Array<{ propertyId: string; displayName: string; accountName: string }>>([]);
  const [discoveredGscSites, setDiscoveredGscSites] = useState<Array<{ siteUrl: string; permissionLevel: string }>>([]);
  const [discoveredGbpLocations, setDiscoveredGbpLocations] = useState<Array<{ name: string; title: string; primaryCategory?: string; address?: string; phone?: string; websiteUri?: string }>>([]);
  const [loadingGa4Props, setLoadingGa4Props] = useState(false);
  const [loadingGscSites, setLoadingGscSites] = useState(false);
  const [loadingGbpLocations, setLoadingGbpLocations] = useState(false);
  const [ga4DiscError, setGa4DiscError] = useState("");
  const [gscDiscError, setGscDiscError] = useState("");
  const [gbpDiscError, setGbpDiscError] = useState("");
  const [isConnectingGbp, setIsConnectingGbp] = useState(false);
  const [selectedGbpLocationName, setSelectedGbpLocationName] = useState("");

  // Settings tab inline status inputs
  const [settingsManager, setSettingsManager] = useState("");
  const [settingsNotes, setSettingsNotes] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Analytics Tab Chart States
  const [activeMetric, setActiveMetric] = useState<"sessions" | "organicTraffic" | "conversions">("sessions");
  const [chartGroup, setChartGroup] = useState<"day" | "week">("day");

  // Fetch unified workspace data
  const fetchWorkspace = useCallback(async () => {
    if (isNaN(clientId)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/workspace?range=${range}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Client not found.");
        }
        throw new Error("Failed to load client workspace.");
      }
      const payload: WorkspacePayload = await res.json();
      setData(payload);

      // Initialize form fields from loaded values
      const ga4Conn = payload.client.properties[0]?.connections.find(c => c.provider === "GA4");
      const gscConn = payload.client.properties[0]?.connections.find(c => c.provider === "GSC");

      setGa4PropId(ga4Conn?.externalId || "");
      setGa4EventName(ga4Conn?.conversionEventName || "");
      setGscDomainUrl(gscConn?.externalId || payload.domain);

      setSettingsManager(payload.client.managerName || "");
      setSettingsNotes(payload.client.notes || "");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  }, [clientId, range]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  // Fetch discovered properties/sites after OAuth connections exist
  const fetchDiscoveredResources = useCallback(async () => {
    if (isNaN(clientId) || !data) return;

    const ga4Conn = data.client.properties[0]?.connections.find(c => c.provider === "GA4");
    const gscConn = data.client.properties[0]?.connections.find(c => c.provider === "GSC");
    const gbpConn = data.client.properties[0]?.connections.find(c => c.provider === "GBP");

    // Fetch GA4 properties
    if (ga4Conn && (ga4Conn.status === "CONNECTED" || ga4Conn.status === "SYNC_ERROR")) {
      setLoadingGa4Props(true);
      setGa4DiscError("");
      try {
        const res = await fetch(`/api/clients/${clientId}/connections/discover-ga4`);
        const resData = await res.json();
        if (resData.error) {
          setGa4DiscError(resData.error);
        } else {
          setDiscoveredGa4Properties(resData.properties || []);
        }
      } catch (err: any) {
        setGa4DiscError("Failed to discover GA4 properties");
      } finally {
        setLoadingGa4Props(false);
      }
    } else {
      setDiscoveredGa4Properties([]);
    }

    // Fetch GSC sites
    if (gscConn && (gscConn.status === "CONNECTED" || gscConn.status === "SYNC_ERROR")) {
      setLoadingGscSites(true);
      setGscDiscError("");
      try {
        const res = await fetch(`/api/clients/${clientId}/connections/discover-gsc`);
        const resData = await res.json();
        if (resData.error) {
          setGscDiscError(resData.error);
        } else {
          setDiscoveredGscSites(resData.sites || []);
        }
      } catch (err: any) {
        setGscDiscError("Failed to discover GSC properties");
      } finally {
        setLoadingGscSites(false);
      }
    } else {
      setDiscoveredGscSites([]);
    }

    // Fetch GBP locations
    if (gbpConn && (gbpConn.status === "CONNECTED" || gbpConn.status === "SYNC_ERROR")) {
      setLoadingGbpLocations(true);
      setGbpDiscError("");
      try {
        const res = await fetch(`/api/clients/${clientId}/connections/discover-gbp`);
        const resData = await res.json();
        if (resData.error) {
          setGbpDiscError(resData.error);
        } else {
          setDiscoveredGbpLocations(resData.locations || []);
        }
      } catch (err: any) {
        setGbpDiscError("Failed to discover GMB locations");
      } finally {
        setLoadingGbpLocations(false);
      }
    } else {
      setDiscoveredGbpLocations([]);
    }
  }, [clientId, data]);

  useEffect(() => {
    if (activeTab === "integrations" && data) {
      fetchDiscoveredResources();
    }
  }, [activeTab, data, fetchDiscoveredResources]);

  // Document listener to close actions popup
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowMoreActions(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

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

  const { client, domain, initials, ga4Status, gscStatus, gbpStatus, ga4Error, gscError, gbpError, lastSyncTime, metrics, history, deliveries, activityLogs, prStats, linkStats, rankingStats, onpageStats, gbpStats } = data;

  // Clipboard copy handler for secure share links
  const handleCopyLink = async () => {
    if (!client.shareToken) return;
    const origin = window.location.origin;
    const shareUrl = `${origin}/share/${client.shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      success("Share link copied to clipboard.");
    } catch {
      toastError("Failed to copy share link.");
    }
  };

  // Regenerate Share Link token handler
  const handleRegenerateToken = async () => {
    const isConfirmed = await confirm({
      title: "Regenerate Share Link",
      message: "Are you sure you want to regenerate the share token? The existing link will stop working immediately.",
      confirmText: "Regenerate",
      destructive: true
    });
    if (!isConfirmed) return;

    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/share-token`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate token.");
      success("Share link regenerated successfully.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to regenerate share token." });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Archive Client handler
  const handleArchiveClient = async () => {
    const isConfirmed = await confirm({
      title: "Archive Client",
      message: `Are you sure you want to archive ${client.name}?`,
      confirmText: "Archive",
      destructive: true
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true })
      });
      if (!res.ok) throw new Error("Failed to archive client.");
      success("Client archived successfully.");
      router.push("/admin/clients");
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to archive client." });
    }
  };

  // Restore Client handler
  const handleRestoreClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false, status: "ACTIVE" })
      });
      if (!res.ok) throw new Error("Failed to restore client.");
      success("Client restored successfully.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to restore client." });
    }
  };

  // Manual sync trigger action
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/sync`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to trigger manual sync");
      }
      success(resData.message || "Manual sync completed successfully.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to sync data." });
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect GA4 Connection Action - redirects to OAuth without ID
  const handleConnectGA4OAuth = () => {
    setIsConnectingGA4(true);
    try {
      window.location.href = `/api/auth/google?clientId=${clientId}&provider=GA4`;
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to start Google Analytics auth flow." });
      setIsConnectingGA4(false);
    }
  };

  // Save selected/entered GA4 property configuration
  const handleSaveGA4Property = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ga4PropId.trim()) {
      toastError("Property ID is required to set up GA4 connection.");
      return;
    }
    setIsConnectingGA4(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "GA4",
          externalId: ga4PropId.trim(),
          conversionEventName: ga4EventName.trim() || undefined,
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save GA4 configuration.");
      }
      success("GA4 configuration saved successfully and initial sync complete.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to configure Google Analytics." });
    } finally {
      setIsConnectingGA4(false);
    }
  };

  // Disconnect GA4 Connection Action
  const handleDisconnectGA4 = async () => {
    const isConfirmed = await confirm({
      title: "Disconnect GA4",
      message: "Are you sure you want to disconnect Google Analytics 4? This will disable GA4 metrics sync.",
      confirmText: "Disconnect",
      destructive: true
    });
    if (!isConfirmed) return;

    setIsConnectingGA4(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections?provider=GA4`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to disconnect.");
      success("GA4 disconnected successfully.");
      setGa4PropId("");
      setGa4EventName("");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to disconnect GA4." });
    } finally {
      setIsConnectingGA4(false);
    }
  };

  // Connect GSC Connection Action - redirects to OAuth without ID
  const handleConnectGSCOAuth = () => {
    setIsConnectingGSC(true);
    try {
      window.location.href = `/api/auth/google?clientId=${clientId}&provider=GSC`;
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to start Google Search Console auth flow." });
      setIsConnectingGSC(false);
    }
  };

  // Save selected/entered GSC site configuration
  const handleSaveGSCSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gscDomainUrl.trim()) {
      toastError("GSC Property / Domain URL is required.");
      return;
    }
    setIsConnectingGSC(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "GSC",
          externalId: gscDomainUrl.trim(),
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save GSC configuration.");
      }
      success("GSC configuration saved successfully and initial sync complete.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to configure Google Search Console." });
    } finally {
      setIsConnectingGSC(false);
    }
  };

  // Disconnect GSC Connection Action
  const handleDisconnectGSC = async () => {
    const isConfirmed = await confirm({
      title: "Disconnect GSC",
      message: "Are you sure you want to disconnect Google Search Console?",
      confirmText: "Disconnect",
      destructive: true
    });
    if (!isConfirmed) return;

    setIsConnectingGSC(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections?provider=GSC`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to disconnect.");
      success("GSC disconnected successfully.");
      setGscDomainUrl(domain);
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to disconnect GSC." });
    } finally {
      setIsConnectingGSC(false);
    }
  };

  // Connect GBP Action - redirects to OAuth
  const handleConnectGBPOAuth = () => {
    setIsConnectingGbp(true);
    try {
      window.location.href = `/api/auth/google?clientId=${clientId}&provider=GBP`;
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to start Google Business Profile auth flow." });
      setIsConnectingGbp(false);
    }
  };

  // Save selected GBP mapping
  const handleSaveGBPLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGbpLocationName) {
      toastError("Storefront selection is required.");
      return;
    }
    const selected = discoveredGbpLocations.find(l => l.name === selectedGbpLocationName);
    if (!selected) return;

    setIsConnectingGbp(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/connections/connect-gbp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: selected.name,
          accountName: (selected as any).accountName,
          displayName: selected.title,
          primaryCategory: selected.primaryCategory,
          address: selected.address,
          phone: selected.phone,
          websiteUri: selected.websiteUri
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save GBP mapping.");
      }
      success("GBP listing mapped successfully. Sync is running in background.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to connect GBP storefront." });
    } finally {
      setIsConnectingGbp(false);
    }
  };

  // Disconnect GBP listing
  const handleDisconnectGBP = async () => {
    if (!gbpStats?.id) return;
    const isConfirmed = await confirm({
      title: "Disconnect GBP Location",
      message: "Are you sure you want to disconnect Google Business Profile? All local SEO performance history will be deleted.",
      confirmText: "Disconnect",
      destructive: true
    });
    if (!isConfirmed) return;

    setIsConnectingGbp(true);
    try {
      const res = await fetch(`/api/gbp/locations/${gbpStats.id}/disconnect`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to disconnect.");
      success("GBP location disconnected successfully.");
      setSelectedGbpLocationName("");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to disconnect GBP." });
    } finally {
      setIsConnectingGbp(false);
    }
  };

  // Save general settings updates (inline)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerName: settingsManager.trim() || null,
          notes: settingsNotes.trim() || null
        })
      });
      if (!res.ok) throw new Error("Failed to update settings.");
      success("Settings saved successfully.");
      await fetchWorkspace();
    } catch (err: unknown) {
      handleApiError(err, { toast: { error: toastError }, fallbackMessage: "Failed to save settings." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Activity Log mapper formatting helper
  const getActivityLogMeta = (action: string, metaStr: string | null) => {
    const meta = metaStr ? JSON.parse(metaStr) : {};
    switch (action) {
      case "CLIENT_CREATED":
        return { label: "Client account created", dotClass: styles.create, desc: meta.companyName ? `Registered under ${meta.companyName}` : "New profile setup" };
      case "WEBSITE_CHANGED":
        return { label: "Website domain updated", dotClass: styles.update, desc: `Domain mapped to: ${meta.domain || meta.newDomain || ""}` };
      case "INTEGRATION_CONNECTED":
        return { label: `${meta.provider} connected`, dotClass: styles.connectedDot, desc: `Verification ID: ${meta.externalId || "N/A"}` };
      case "INTEGRATION_DISCONNECTED":
        return { label: `${meta.provider} disconnected`, dotClass: styles.archiveDot, desc: "Access revoked by admin" };
      case "SHARE_LINK_REGENERATED":
        return { label: "Share link regenerated", dotClass: styles.update, desc: "Generated new UUID secure token" };
      case "CLIENT_UPDATED":
        return { label: "Client details updated", dotClass: styles.update, desc: `Changed: ${meta.changes ? meta.changes.join(", ") : "account settings"}` };
      case "CLIENT_ARCHIVED":
        return { label: "Client archived", dotClass: styles.archiveDot, desc: "Soft-deleted and removed from portfolios" };
      case "CLIENT_RESTORED":
        return { label: "Client restored", dotClass: styles.connectedDot, desc: "Restored to active lists" };
      default:
        return { label: action.replace(/_/g, " ").toLowerCase(), dotClass: styles.update, desc: "Administrative update completed" };
    }
  };

  // SVG Trend Line Chart Coordinates mapper (Multi-tab reusable)
  const renderSVGChart = (metricKey: "sessions" | "organicTraffic" | "conversions") => {
    const currentHist = history?.current || [];
    const prevHist = history?.previous || [];

    if (currentHist.length < 2) {
      return (
        <div className={styles.noChartData}>
          Insufficient data points to plot timeline trend.
        </div>
      );
    }

    const currentValues = currentHist.map(h => h[metricKey]);
    const prevValues = prevHist.map(h => h[metricKey]);
    const maxVal = Math.max(...currentValues, ...prevValues, 100);
    const minVal = 0;
    const paddingY = 20;
    const chartHeight = 220;
    const width = 1100;
    const stepX = width / (currentHist.length - 1);

    const getPointsStr = (dataset: typeof currentHist) => {
      return dataset.map((pt, idx) => {
        const val = pt[metricKey] || 0;
        const x = idx * stepX;
        const y = chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
        return `${x},${y}`;
      }).join(" ");
    };

    const currentPoints = getPointsStr(currentHist);
    const prevPoints = prevHist.length >= 2 ? getPointsStr(prevHist) : "";

    return (
      <div className={styles.chartContainer}>
        <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight / 2} x2={width} y2={chartHeight / 2} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1={chartHeight - paddingY} x2={width} y2={chartHeight - paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Fills */}
          {prevPoints && (
            <path d={`M 0,${chartHeight - paddingY} L ${prevPoints} L ${width},${chartHeight - paddingY} Z`} fill="url(#prevGrad)" />
          )}
          {currentPoints && (
            <path d={`M 0,${chartHeight - paddingY} L ${currentPoints} L ${width},${chartHeight - paddingY} Z`} fill="url(#currentGrad)" />
          )}

          {/* Lines */}
          {prevPoints && (
            <polyline fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="4 4" points={prevPoints} opacity="0.6" />
          )}
          {currentPoints && (
            <polyline fill="none" stroke="var(--accent-color)" strokeWidth="2.5" points={currentPoints} />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Back link breadcrumb */}
      <div className={styles.breadcrumbBar}>
        <Link href="/admin/clients" className={styles.btnBackLink}>
          <ArrowLeft size={14} />
          Back to Clients Portfolio
        </Link>
      </div>

      {/* Header Dashboard Profile block */}
      <div className={styles.clientHeader}>
        <div className={styles.clientHeaderMain}>
          <div className={styles.avatar}>
            {initials}
          </div>
          <div className={styles.clientMeta}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h1 className={styles.clientName}>{client.name}</h1>
              <span className={`${styles.statusLabel} ${styles[client.status.toLowerCase()]}`}>
                {client.status}
              </span>
              {client.isArchived && (
                <span className={`${styles.statusLabel} ${styles.archived}`}>
                  Archived
                </span>
              )}
            </div>
            <div className={styles.subMeta}>
              {client.companyName && <span className={styles.companyName}>{client.companyName}</span>}
              {client.companyName && <span>•</span>}
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.domainLink}
              >
                {domain}
                <ExternalLink size={11} style={{ marginLeft: "4px", opacity: 0.5 }} />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.clientHeaderActions}>
          <button
            className={styles.btnActionSecondary}
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 size={13} />
            Edit Client
          </button>

          <div style={{ position: "relative" }}>
            <button
              className={styles.btnActionIcon}
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreActions(!showMoreActions);
              }}
              title="More actions"
            >
              <MoreVertical size={16} />
            </button>
            {showMoreActions && (
              <div
                className={styles.actionsDropdown}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => { setShowMoreActions(false); handleCopyLink(); }}>
                  {copiedLink ? <Check size={13} style={{ color: "var(--success)" }} /> : <Copy size={13} />}
                  Copy Share Link
                </button>
                <button onClick={() => { setShowMoreActions(false); handleRegenerateToken(); }}>
                  <RefreshCw size={13} />
                  Regenerate Share Link
                </button>
                <button onClick={async () => {
                  setShowMoreActions(false);
                  await navigator.clipboard.writeText(clientId.toString());
                  success(`Copied Client ID: ${clientId}`);
                }}>
                  <Globe size={13} />
                  Copy Client ID
                </button>
                {client.isArchived ? (
                  <button onClick={() => { setShowMoreActions(false); handleRestoreClient(); }} style={{ color: "var(--success)" }}>
                    <RotateCcw size={13} />
                    Restore Client
                  </button>
                ) : (
                  <button onClick={() => { setShowMoreActions(false); handleArchiveClient(); }} style={{ color: "var(--error)" }}>
                    <Archive size={13} />
                    Archive Client
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Switch Navigation Row */}
      <nav className={styles.tabNav}>
        {[
          { id: "overview", label: "Overview" },
          { id: "analytics", label: "Analytics" },
          { id: "integrations", label: "Integrations" },
          { id: "activity", label: "Activity Logs" },
          { id: "settings", label: "Settings" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
          >
            {tab.id === "overview" && <Globe size={14} style={{ marginRight: "6px", opacity: 0.8 }} />}
            {tab.id === "analytics" && <Activity size={14} style={{ marginRight: "6px", opacity: 0.8 }} />}
            {tab.id === "integrations" && <Database size={14} style={{ marginRight: "6px", opacity: 0.8 }} />}
            {tab.id === "activity" && <Calendar size={14} style={{ marginRight: "6px", opacity: 0.8 }} />}
            {tab.id === "settings" && <Settings size={14} style={{ marginRight: "6px", opacity: 0.8 }} />}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Dynamic Tab Contents */}
      <main className={styles.tabContent}>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className={styles.workspaceGrid}>

            {/* META ROW */}
            <div className={styles.metaRow}>
              {/* Client Summary card */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>Client Summary</span>
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Website URL</span>
                    <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className={styles.domainLink}>
                      {domain}
                      <ExternalLink size={11} style={{ marginLeft: "4px" }} />
                    </a>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Account Manager</span>
                    <span className={styles.detailValue}>{client.managerName || "Unassigned"}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Start Date</span>
                    <span className={styles.detailValue}>
                      {client.startDate ? new Date(client.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Registered Date</span>
                    <span className={styles.detailValue}>
                      {new Date(client.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connections Status list */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>Integrations Status</span>
                <div className={styles.detailsList}>
                  {/* GA4 */}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Google Analytics 4</span>
                    <span className={`${styles.statusBadge} ${styles[ga4Status.toLowerCase()]}`}>
                      {ga4Status}
                    </span>
                  </div>
                  {/* GSC */}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Search Console</span>
                    <span className={`${styles.statusBadge} ${styles[gscStatus.toLowerCase()]}`}>
                      {gscStatus}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Sync Time</span>
                    <span className={styles.detailValue} style={{ fontSize: "0.75rem" }}>{lastSyncTime || "Never"}</span>
                  </div>
                  {(ga4Status === "CONNECTED" || gscStatus === "CONNECTED") && (
                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                      <button
                        onClick={handleManualSync}
                        className={styles.btnActionPrimary}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={14} className={isSyncing ? "spin" : ""} />
                        {isSyncing ? "Syncing..." : "Sync Now"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className={styles.mainColumn}>
              {/* Performance Cards Grid */}
              <div className={styles.metricsGrid}>
                {/* Sessions */}
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Organic Sessions (GA4)</span>
                  <span className={styles.metricVal}>
                    {metrics?.sessions.toLocaleString() || 0}
                  </span>
                  <div className={styles.metricTrendRow}>
                    {metrics && (
                      <span className={`${styles.trendBadge} ${metrics.sessionsChange >= 0 ? styles.positive : styles.negative}`}>
                        {metrics.sessionsChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {metrics.sessionsChange >= 0 ? "+" : ""}{metrics.sessionsChange.toFixed(1)}%
                      </span>
                    )}
                    <span className={styles.trendPeriod}>vs previous period</span>
                  </div>
                </div>

                {/* Clicks */}
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Search Clicks (GSC)</span>
                  <span className={styles.metricVal}>
                    {metrics?.organicTraffic.toLocaleString() || 0}
                  </span>
                  <div className={styles.metricTrendRow}>
                    {metrics && (
                      <span className={`${styles.trendBadge} ${metrics.organicTrafficChange >= 0 ? styles.positive : styles.negative}`}>
                        {metrics.organicTrafficChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {metrics.organicTrafficChange >= 0 ? "+" : ""}{metrics.organicTrafficChange.toFixed(1)}%
                      </span>
                    )}
                    <span className={styles.trendPeriod}>vs previous period</span>
                  </div>
                </div>

                {/* Conversions */}
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Goal Conversions (GA4)</span>
                  <span className={styles.metricVal}>
                    {metrics?.conversions.toLocaleString() || 0}
                  </span>
                  <div className={styles.metricTrendRow}>
                    {metrics && (
                      <span className={`${styles.trendBadge} ${metrics.conversionsChange >= 0 ? styles.positive : styles.negative}`}>
                        {metrics.conversionsChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {metrics.conversionsChange >= 0 ? "+" : ""}{metrics.conversionsChange.toFixed(1)}%
                      </span>
                    )}
                    <span className={styles.trendPeriod}>vs previous period</span>
                  </div>
                </div>
              </div>

              {/* Chart section */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>Performance Timeline</span>
                  <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "12px", height: "3px", background: "var(--accent-color)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>Current Period</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "12px", height: "3px", background: "var(--text-muted)", opacity: 0.6 }} />
                      <span style={{ color: "var(--text-secondary)" }}>Previous Period</span>
                    </div>

                    {/* Range select inside chart */}
                    <select
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      className={styles.chartRangeSelect}
                    >
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="90d">90 Days</option>
                      <option value="1y">1 Year</option>
                    </select>
                  </div>
                </div>

                {renderSVGChart(activeMetric)}
              </div>
            </div>

            {/* MODULES GRID */}
            <div className={styles.modulesGrid}>
              {/* Digital PR Summary Card */}
              {prStats && (
                <div className={styles.card}>
                  <span className={styles.cardTitle}>Digital PR Performance</span>
                  <div className={styles.detailsList}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Active PR Campaigns</span>
                      <span className={styles.detailValue}>{prStats.activeCampaigns}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Outreach Targets</span>
                      <span className={styles.detailValue}>{prStats.totalOutreach}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Published Placements</span>
                      <span className={styles.detailValue} style={{ color: "#0D9488", fontWeight: "600" }}>{prStats.publishedPlacements}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Response Rate</span>
                      <span className={styles.detailValue}>{prStats.responseRate.toFixed(1)}%</span>
                    </div>
                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                      <Link
                        href={`/admin/pr?clientId=${client.id}`}
                        className={styles.btnActionPrimary}
                        style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                      >
                        Manage Campaigns
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Link Building Summary Card */}
              {linkStats && (
                <div className={styles.card}>
                  <span className={styles.cardTitle}>Link Building Performance</span>
                  <div className={styles.detailsList}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Active Link Campaigns</span>
                      <span className={styles.detailValue}>{linkStats.activeCampaigns}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Qualified Opportunities</span>
                      <span className={styles.detailValue}>{linkStats.qualifiedOpportunities}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Acquired Backlinks</span>
                      <span className={styles.detailValue} style={{ color: "#0D9488", fontWeight: "600" }}>{linkStats.acquiredLinks}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Live Backlinks</span>
                      <span className={styles.detailValue} style={{ color: "#16A34A", fontWeight: "600" }}>{linkStats.liveLinks}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Links Needing Attention</span>
                      <span className={styles.detailValue} style={{ color: linkStats.attentionLinks > 0 ? "var(--error)" : "inherit" }}>
                        {linkStats.attentionLinks}
                      </span>
                    </div>
                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                      <Link
                        href={`/admin/links?clientId=${client.id}`}
                        className={styles.btnActionPrimary}
                        style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                      >
                        Manage Campaigns
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Rankings & Keyword Performance Summary Card */}
              {rankingStats && (
                <div className={styles.card}>
                  <span className={styles.cardTitle}>Rankings & Keyword Performance</span>
                  <div className={styles.detailsList}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Tracked Keywords</span>
                      <span className={styles.detailValue}>{rankingStats.trackedKeywords}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Average Position</span>
                      <span className={styles.detailValue} style={{ color: "#0D9488", fontWeight: "600" }}>{rankingStats.averagePosition || "—"}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Top 3 / Top 10</span>
                      <span className={styles.detailValue}>{rankingStats.top3Count} / {rankingStats.top10Count}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Improved (Period)</span>
                      <span className={styles.detailValue} style={{ color: "#16A34A", fontWeight: "600" }}>+{rankingStats.improvedKeywords}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Declined (Period)</span>
                      <span className={styles.detailValue} style={{ color: "#EF4444", fontWeight: "600" }}>-{rankingStats.declinedKeywords}</span>
                    </div>
                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                      <Link
                        href={`/admin/rankings?clientId=${client.id}`}
                        className={styles.btnActionPrimary}
                        style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                      >
                        View Rankings Dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* On-Page SEO Summary Card */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>On-Page SEO Audit Status</span>
                <div className={styles.detailsList}>
                  {onpageStats ? (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>SEO Score</span>
                        <span className={styles.detailValue} style={{
                          color: (onpageStats.score || 0) >= 90 ? "#10B981" : (onpageStats.score || 0) >= 70 ? "#F59E0B" : "#EF4444",
                          fontWeight: "700"
                        }}>
                          {onpageStats.score !== null ? onpageStats.score : "Running..."}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Pages Crawled</span>
                        <span className={styles.detailValue}>{onpageStats.pagesCrawled}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Critical Issues</span>
                        <span className={styles.detailValue} style={{
                          color: onpageStats.issuesCritical > 0 ? "var(--error)" : "#16A34A",
                          fontWeight: "600"
                        }}>
                          {onpageStats.issuesCritical} Critical
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Crawl Status</span>
                        <span className={styles.detailValue} style={{ textTransform: "capitalize", fontWeight: "600" }}>
                          {onpageStats.status.toLowerCase()}
                        </span>
                      </div>
                      <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <Link
                          href={`/admin/onpage/audits/${onpageStats.id}`}
                          className={styles.btnActionPrimary}
                          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                        >
                          View Full Audit Details
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                        No On-Page SEO audit has been performed for this property yet.
                      </div>
                      <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <Link
                          href="/admin/onpage"
                          className={styles.btnActionPrimary}
                          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                        >
                          Configure First Crawl
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* GBP Summary Card */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>Google Business Profile (Local SEO)</span>
                <div className={styles.detailsList}>
                  {gbpStats ? (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Connected Listing</span>
                        <span className={styles.detailValue} style={{ fontWeight: "600" }}>{gbpStats.displayName}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Primary Category</span>
                        <span className={styles.detailValue}>{gbpStats.primaryCategory || "—"}</span>
                      </div>
                      {gbpStats.latestMetrics ? (
                        <>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Latest Daily Views (Search/Maps)</span>
                            <span className={styles.detailValue}>{gbpStats.latestMetrics.viewsSearch} / {gbpStats.latestMetrics.viewsMaps}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Latest Daily Website Clicks</span>
                            <span className={styles.detailValue}>{gbpStats.latestMetrics.clicksWebsite}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: "6px 0", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                          Waiting for daily performance metrics sync.
                        </div>
                      )}
                      <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <Link
                          href={`/admin/gbp/locations/${gbpStats.id}`}
                          className={styles.btnActionPrimary}
                          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                        >
                          View Local SEO Dashboard
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                        No local Google storefront mapping is configured.
                      </div>
                      <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <button
                          onClick={() => {
                            setActiveTab("integrations");
                            setTimeout(() => {
                              const el = document.getElementById("gbp-setup-card");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                          }}
                          className={styles.btnActionPrimary}
                          style={{ display: "block", width: "100%", textAlign: "center", border: "none", cursor: "pointer" }}
                        >
                          Configure GBP Connection
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER ROW */}
            <div className={styles.metaRow}>
              {/* Recent Deliveries Table */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>Recent SEO Campaign Deliveries</span>
                {deliveries.length > 0 ? (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Metadata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.slice(0, 5).map((d) => (
                          <tr key={d.id}>
                            <td>{new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td>
                              <span className={`${styles.deliveryBadge} ${styles[d.type.toLowerCase()]}`}>
                                {d.type === "BACKLINK" ? <LinkIcon size={10} style={{ marginRight: "4px" }} /> : <FileText size={10} style={{ marginRight: "4px" }} />}
                                {d.type}
                              </span>
                            </td>
                            <td style={{ fontWeight: "500", color: "var(--text-primary)" }}>{d.description}</td>
                            <td>
                              {d.type === "BACKLINK" && d.linkDetails && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  DA: {d.linkDetails.domainAuthority} | Target: {d.linkDetails.targetUrl.replace(/^(https?:\/\/)?(www\.)?/, "").slice(0, 20)}...
                                </span>
                              )}
                              {d.type === "CONTENT" && d.contentDetails && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {d.contentDetails.wordCount} words
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
                    No delivery activity completed in this period.
                  </p>
                )}
              </div>

              {/* Recent Activity audit logs */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>Recent Activity Logs</span>
                {activityLogs.length === 0 ? (
                  <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", textAlign: "center" }}>No logs recorded.</p>
                ) : (
                  <div className={styles.activityTimelineCompact}>
                    {activityLogs.slice(0, 5).map((log) => {
                      const meta = getActivityLogMeta(log.action, log.metadata);
                      return (
                        <div key={log.id} className={styles.timelineItemCompact}>
                          <div className={`${styles.timelineDot} ${meta.dotClass}`} />
                          <div className={styles.timelineBodyCompact}>
                            <span className={styles.activityLabelCompact}>{meta.label}</span>
                            <span className={styles.activityMetaCompact}>by {log.actorEmail}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className={styles.workspaceGrid}>
            <div className={styles.mainColumn} style={{ flex: "1 1 100%" }}>
              <div className={styles.card}>
                <div className={styles.analyticsControls}>
                  <div className={styles.controlGroup}>
                    <label>Selected Metric</label>
                    <div className={styles.pillGroup}>
                      {[
                        { id: "sessions", label: "GA4 Sessions" },
                        { id: "organicTraffic", label: "Search Clicks" },
                        { id: "conversions", label: "Goal Conversions" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          className={`${styles.pillBtn} ${activeMetric === m.id ? styles.pillBtnActive : ""}`}
                          onClick={() => setActiveMetric(m.id as any)}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.controlGroup}>
                    <label>Timeline Range</label>
                    <div className={styles.pillGroup}>
                      {[
                        { id: "7d", label: "7 Days" },
                        { id: "30d", label: "30 Days" },
                        { id: "90d", label: "90 Days" },
                        { id: "1y", label: "1 Year" }
                      ].map((r) => (
                        <button
                          key={r.id}
                          className={`${styles.pillBtn} ${range === r.id ? styles.pillBtnActive : ""}`}
                          onClick={() => setRange(r.id)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {renderSVGChart(activeMetric)}
              </div>

              {/* Data Table of daily trends */}
              <div className={styles.card}>
                <span className={styles.cardTitle}>Timeline Metrics Ledger</span>
                {history && history.current.length > 0 ? (
                  <div className={styles.tableWrapper} style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th style={{ textAlign: "right" }}>Organic Sessions (GA4)</th>
                          <th style={{ textAlign: "right" }}>Search Clicks (GSC)</th>
                          <th style={{ textAlign: "right" }}>Goal Conversions (GA4)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.current.map((h, idx) => {
                          const dateObj = new Date(h.date);
                          const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: "600" }}>{dateStr}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{h.sessions.toLocaleString()}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{h.organicTraffic.toLocaleString()}</td>
                              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{h.conversions.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>No historical logs available for this period.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTEGRATIONS */}
        {activeTab === "integrations" && (
          <div className={styles.workspaceGrid}>
            {/* GA4 Setup Card */}
            <div className={styles.mainColumn}>
              <div className={styles.card}>
                <h3 className={styles.setupTitle}>Google Analytics 4 Integration</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "20px" }}>
                  Connect your GA4 Property ID and choose the primary conversion goals to sync active sessions and conversion stats to the portal dashboard.
                </p>

                {ga4Status === "DISCONNECTED" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                    <button
                      onClick={handleConnectGA4OAuth}
                      className={styles.btnActionPrimary}
                      style={{ cursor: "pointer" }}
                      disabled={isConnectingGA4}
                    >
                      {isConnectingGA4 ? "Redirecting..." : "Connect Google Analytics 4"}
                    </button>
                    <small style={{ color: "var(--text-muted)" }}>This will redirect you to Google to authorize access to your Google Analytics data.</small>
                  </div>
                ) : (
                  <form onSubmit={handleSaveGA4Property} className={styles.setupForm}>
                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>Discovered GA4 Properties</label>
                      {loadingGa4Props ? (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          <div className={styles.spinner} style={{ width: 14, height: 14 }} />
                          Discovering accessible properties...
                        </div>
                      ) : ga4DiscError ? (
                        <div style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "8px" }}>
                          ⚠️ {ga4DiscError}
                        </div>
                      ) : discoveredGa4Properties.length === 0 ? (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                          No properties found in this Google account.
                        </div>
                      ) : (
                        <select
                          className={styles.formInput}
                          value={ga4PropId}
                          onChange={(e) => setGa4PropId(e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                        >
                          <option value="">-- Choose GA4 Property --</option>
                          {discoveredGa4Properties.map((p) => (
                            <option key={p.propertyId} value={p.propertyId}>
                              {p.displayName} ({p.propertyId}) - {p.accountName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>GA4 Property ID (Manual Override)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={ga4PropId}
                        onChange={(e) => setGa4PropId(e.target.value)}
                        placeholder="e.g. 382901847"
                        required
                      />
                      <small>Enter or select the numeric Property ID resolved from your Google Analytics setup panel.</small>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>Conversion Event Filter (Optional)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={ga4EventName}
                        onChange={(e) => setGa4EventName(e.target.value)}
                        placeholder="e.g. purchase, generate_lead"
                      />
                      <small style={{ display: "block", marginTop: "4px" }}>Specify a key event name to record under conversions. Defaults to all active conversion events.</small>
                    </div>

                    <div className={styles.formActions} style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                      <button
                        type="submit"
                        className={styles.btnActionPrimary}
                        style={{ cursor: "pointer" }}
                        disabled={isConnectingGA4}
                      >
                        {isConnectingGA4 ? "Saving..." : "Save GA4 Configuration"}
                      </button>

                      <button
                        type="button"
                        className={styles.btnActionDanger}
                        style={{ cursor: "pointer" }}
                        onClick={handleDisconnectGA4}
                        disabled={isConnectingGA4}
                      >
                        Disconnect GA4
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* GBP Setup Card */}
              <div className={styles.card} id="gbp-setup-card" style={{ marginTop: "24px" }}>
                <h3 className={styles.setupTitle}>Google Business Profile Integration</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "20px" }}>
                  Connect your business storefront to pull real-time Maps impressions, website clicks, telephone calls, and local directions.
                </p>

                {gbpStatus === "DISCONNECTED" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                    <button
                      onClick={handleConnectGBPOAuth}
                      className={styles.btnActionPrimary}
                      style={{ cursor: "pointer" }}
                      disabled={isConnectingGbp}
                    >
                      {isConnectingGbp ? "Redirecting..." : "Connect Google Business Profile"}
                    </button>
                    <small style={{ color: "var(--text-muted)" }}>This will redirect you to Google to authorize access to your Google Business listings.</small>
                  </div>
                ) : (
                  <form onSubmit={handleSaveGBPLocation} className={styles.setupForm}>
                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>Discovered storefront Locations</label>
                      {loadingGbpLocations ? (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          <div className={styles.spinner} style={{ width: 14, height: 14 }} />
                          Discovering accessible storefronts...
                        </div>
                      ) : gbpDiscError ? (
                        <div style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "8px" }}>
                          ⚠️ {gbpDiscError}
                        </div>
                      ) : discoveredGbpLocations.length === 0 ? (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                          No business storefronts found in this Google account.
                        </div>
                      ) : (
                        <select
                          className={styles.formInput}
                          value={selectedGbpLocationName}
                          onChange={(e) => setSelectedGbpLocationName(e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                        >
                          <option value="">-- Choose Storefront Listing --</option>
                          {discoveredGbpLocations.map((l) => (
                            <option key={l.name} value={l.name}>
                              {l.title} ({l.primaryCategory || "No Category"}) - {l.address || "No Address"}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {gbpStats && (
                      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "0.85rem" }}>
                        <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Active Mapped Storefront:</span>
                        <strong>{gbpStats.displayName}</strong> ({gbpStats.primaryCategory || "Local Store"})
                      </div>
                    )}

                    <div className={styles.formActions} style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                      <button
                        type="submit"
                        className={styles.btnActionPrimary}
                        style={{ cursor: "pointer" }}
                        disabled={isConnectingGbp || !selectedGbpLocationName}
                      >
                        {isConnectingGbp ? "Mapping..." : "Save GBP Mapping"}
                      </button>

                      {gbpStats && (
                        <button
                          type="button"
                          className={styles.btnActionDanger}
                          style={{ cursor: "pointer" }}
                          onClick={handleDisconnectGBP}
                          disabled={isConnectingGbp}
                        >
                          Disconnect GBP Mapping
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* GSC Setup Card */}
            <div className={styles.sideColumn}>
              <div className={styles.card}>
                <h3 className={styles.setupTitle}>Search Console Property</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "20px" }}>
                  Set up domain ownership validation matching the Search Console property path to fetch keyword impressions and click tracking counts.
                </p>

                {gscStatus === "DISCONNECTED" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                    <button
                      onClick={handleConnectGSCOAuth}
                      className={styles.btnActionPrimary}
                      style={{ cursor: "pointer" }}
                      disabled={isConnectingGSC}
                    >
                      {isConnectingGSC ? "Redirecting..." : "Connect Google Search Console"}
                    </button>
                    <small style={{ color: "var(--text-muted)" }}>This will redirect you to Google to authorize access to your Google Search Console data.</small>
                  </div>
                ) : (
                  <form onSubmit={handleSaveGSCSite} className={styles.setupForm}>
                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>Discovered GSC Properties</label>
                      {loadingGscSites ? (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          <div className={styles.spinner} style={{ width: 14, height: 14 }} />
                          Discovering accessible sites...
                        </div>
                      ) : gscDiscError ? (
                        <div style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "8px" }}>
                          ⚠️ {gscDiscError}
                        </div>
                      ) : discoveredGscSites.length === 0 ? (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                          No verified sites found in this Google account.
                        </div>
                      ) : (
                        <select
                          className={styles.formInput}
                          value={gscDomainUrl}
                          onChange={(e) => setGscDomainUrl(e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                        >
                          <option value="">-- Choose GSC Site --</option>
                          {discoveredGscSites.map((s) => (
                            <option key={s.siteUrl} value={s.siteUrl}>
                              {s.siteUrl} ({s.permissionLevel})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>GSC Property / Domain URL (Manual Override)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={gscDomainUrl}
                        onChange={(e) => setGscDomainUrl(e.target.value)}
                        placeholder="e.g. sc-domain:example.com or https://example.com"
                        required
                      />
                      <small>Enter or select the verified site property URL prefix or sc-domain prefix.</small>
                    </div>

                    <div className={styles.formActions} style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                      <button
                        type="submit"
                        className={styles.btnActionPrimary}
                        style={{ cursor: "pointer" }}
                        disabled={isConnectingGSC}
                      >
                        {isConnectingGSC ? "Saving..." : "Save GSC Configuration"}
                      </button>

                      <button
                        type="button"
                        className={styles.btnActionDanger}
                        style={{ cursor: "pointer" }}
                        onClick={handleDisconnectGSC}
                        disabled={isConnectingGSC}
                      >
                        Disconnect GSC
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY */}
        {activeTab === "activity" && (
          <div className={styles.workspaceGrid}>
            <div className={styles.mainColumn} style={{ flex: "1 1 100%" }}>
              <div className={styles.card}>
                <span className={styles.cardTitle}>Complete Administrative Audit Timeline</span>
                {activityLogs && activityLogs.length > 0 ? (
                  <div className={styles.timelineWrapper}>
                    {activityLogs.map((log) => {
                      const meta = getActivityLogMeta(log.action, log.metadata);
                      const timeStr = new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });
                      return (
                        <div key={log.id} className={styles.fullTimelineItem}>
                          <div className={`${styles.timelineDot} ${meta.dotClass}`} />
                          <div className={styles.timelineBody}>
                            <div className={styles.timelineHeaderRow}>
                              <strong className={styles.timelineActionName}>{meta.label}</strong>
                              <span className={styles.timelineTimestamp}>{timeStr}</span>
                            </div>
                            <p className={styles.timelineDesc}>{meta.desc}</p>
                            <span className={styles.timelineActor}>Logged by admin user: {log.actorEmail}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No operational activities logged for this client profile.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <div className={styles.workspaceGrid}>
            {/* Inline fields editor */}
            <div className={styles.mainColumn}>
              <div className={styles.card}>
                <span className={styles.cardTitle}>Edit Profile Settings</span>
                <form onSubmit={handleSaveSettings} className={styles.setupForm}>
                  <div className={styles.formGroup}>
                    <label>Account Manager Assignment</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={settingsManager}
                      onChange={(e) => setSettingsManager(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Internal Account Notes</label>
                    <textarea
                      className={styles.formTextarea}
                      value={settingsNotes}
                      onChange={(e) => setSettingsNotes(e.target.value)}
                      rows={5}
                      placeholder="Enter special requirements, sync mappings details, or contract limits..."
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.btnActionPrimary}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danger Zone */}
              <div className={styles.card} style={{ border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                <span className={styles.cardTitle} style={{ color: "var(--error)" }}>Danger Zone</span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "20px" }}>
                  Archiving a client soft-deletes the record. Their metrics will be excluded from the admin dashboard and portfolios, but configurations are preserved and can be restored.
                </p>

                <div style={{ display: "flex", gap: "16px" }}>
                  {client.isArchived ? (
                    <button
                      className={styles.btnActionPrimary}
                      onClick={handleRestoreClient}
                    >
                      <RotateCcw size={14} style={{ marginRight: "6px" }} />
                      Restore Client Account
                    </button>
                  ) : (
                    <button
                      className={styles.btnActionDanger}
                      onClick={handleArchiveClient}
                    >
                      <Archive size={14} style={{ marginRight: "6px" }} />
                      Archive Client Account
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sharing Setup Card */}
            <div className={styles.sideColumn}>
              <div className={styles.card}>
                <span className={styles.cardTitle}>Reporting Portal Link</span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "20px" }}>
                  This secure, read-only URL allows clients to view their organic sessions and SEO placements without needing administrator auth credentials.
                </p>

                <div className={styles.shareCardBox}>
                  <div className={styles.shareDisplayBox}>
                    {client.shareToken ? `${window.location.origin}/share/${client.shareToken}` : "No token set"}
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", width: "100%" }}>
                    <button
                      onClick={handleCopyLink}
                      className={styles.btnActionSecondary}
                      style={{ flex: 1 }}
                      disabled={!client.shareToken}
                    >
                      {copiedLink ? <Check size={14} style={{ color: "var(--success)" }} /> : <Copy size={14} />}
                      {copiedLink ? "Copied" : "Copy Link"}
                    </button>
                    <button
                      onClick={handleRegenerateToken}
                      className={styles.btnActionSecondary}
                      title="Regenerate Share link"
                      disabled={isRegenerating || !client.shareToken}
                    >
                      <RefreshCw size={13} className={isRegenerating ? "spin" : ""} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Client modal */}
      {isEditModalOpen && (
        <ClientModal
          clientId={client.id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchWorkspace();
          }}
        />
      )}
    </div>
  );
}
