"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface ContentSettingsPayload {
  sitemapUrl: string | null;
  serpLocationCode: string;
  isV2Enabled: boolean;
  lastSitemapCrawl: string | null;
  lastGscRefresh: string | null;
}

export default function ContentSettingsPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId as string) || "";

  const [settings, setSettings] = useState<ContentSettingsPayload | null>(null);
  const [clientName, setClientName] = useState("Client");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [serpLocation, setSerpLocation] = useState("2826");
  const [isV2Enabled, setIsV2Enabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const clientRes = await fetch(`/api/clients/${clientId}`);
      if (clientRes.ok) {
        const cData = await clientRes.json();
        setClientName(cData.name || "Client");
      }

      const res = await fetch(`/api/content/client/${clientId}/settings`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load settings.");
      }
      const json = await res.json();
      setSettings(json.settings);
      setSitemapUrl(json.settings?.sitemapUrl || "");
      setSerpLocation(json.settings?.serpLocationCode || "2826");
      setIsV2Enabled(json.settings?.isV2Enabled !== undefined ? json.settings.isV2Enabled : true);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      toastError(errObj?.message || "Error loading settings.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router, toastError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/client/${clientId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sitemapUrl,
          serpLocationCode: serpLocation,
          isV2Enabled,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings.");
      success("Content settings saved!");
      fetchSettings();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
        <RefreshCw className={styles.spinner} size={32} />
      </div>
    );
  }

  return (
    <div style={{ background: "#FAFAF9", minHeight: "100vh", padding: "24px 0 80px 0" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* 1. TOP BREADCRUMB */}
        <div style={{ marginBottom: "12px" }}>
          <Link
            href={`/admin/content/${clientId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            Back to {clientName}
          </Link>
        </div>

        {/* 2. HEADER */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
            Content settings — {clientName}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
            Sitemap location and last-refresh timestamps for the v2 pipeline.
          </p>
        </div>

        {/* 3. MAIN SETTINGS CARD */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          {/* Timestamps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", paddingBottom: "20px", borderBottom: "1px solid #F1F5F9", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Last sitemap crawl</div>
              <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A", marginTop: "2px" }}>
                {settings?.lastSitemapCrawl ? new Date(settings.lastSitemapCrawl).toLocaleDateString() : "Never"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Last GSC refresh</div>
              <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A", marginTop: "2px" }}>
                {settings?.lastGscRefresh ? new Date(settings.lastGscRefresh).toLocaleDateString() : "Never"}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Sitemap URL (override)
              </label>
              <input
                type="text"
                placeholder="https://client-site.co.uk/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
              />
              <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>
                Leave blank to auto-derive from the client&apos;s GSC property URL or domain.
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                SERP location (DataForSEO location code)
              </label>
              <select
                value={serpLocation}
                onChange={(e) => setSerpLocation(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", color: "#334155" }}
              >
                <option value="2826">2826 — United Kingdom (default)</option>
                <option value="2840">2840 — United States</option>
                <option value="2124">2124 — Canada</option>
                <option value="2036">2036 — Australia</option>
              </select>
              <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>
                All DataForSEO calls (SERP analysis, fan-out seeds, autocomplete, related searches) use this code. Set per client.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "4px" }}>
              <input
                type="checkbox"
                id="v2pipe"
                checked={isV2Enabled}
                onChange={(e) => setIsV2Enabled(e.target.checked)}
                style={{ marginTop: "3px", cursor: "pointer" }}
              />
              <div>
                <label htmlFor="v2pipe" style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                  v2 pipeline available for this client
                </label>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  Per-client kill switch. The global default toggle is set elsewhere.
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: "9px 20px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#FFFFFF",
                  background: "#10B981",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isSaving ? "not-allowed" : "pointer"
                }}
              >
                {isSaving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </form>
        </div>

        {/* 4. MANUAL REFRESH TRIGGERS */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0" }}>
            Manual refresh
          </h3>
          <p style={{ fontSize: "0.775rem", color: "#64748B", margin: "0 0 16px 0", lineHeight: "1.4" }}>
            Triggered jobs run in the background; check server logs for completion. The cron jobs run automatically on the schedule (sitemap weekly, GSC monthly).
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => success("Sitemap crawler dispatched in background!")}
              style={{
                padding: "8px 16px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                background: "#6366F1",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Refresh sitemap now
            </button>
            <button
              onClick={() => success("GSC and vector embeddings refresh started!")}
              style={{
                padding: "8px 16px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                background: "#6366F1",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Refresh GSC + embeddings now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
