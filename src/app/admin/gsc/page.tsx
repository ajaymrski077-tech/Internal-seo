"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import { handleApiError } from "@/lib/apiUtils";
import { useToast } from "@/components/ToastContext";
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis } from "recharts";

interface GscOverviewItem {
  id: string | number;
  domain: string;
  clientId: string | number;
  clientName: string;
  clicks: number;
  impressions: number;
  avgPosition: string;
  isConnected?: boolean;
  chartData: { date: string; clicks: number; impressions: number }[];
}

export default function GscOverviewPage() {
  const { error: toastError } = useToast();
  const [clientSites, setClientSites] = useState<GscOverviewItem[]>([]);
  const [internalSites, setInternalSites] = useState<GscOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/gsc/overview");
        if (!res.ok) throw new Error("Failed to load GSC overview");
        const json = await res.json();
        setClientSites(json.clientSites || json.data || []);
        setInternalSites(json.internalSites || []);
      } catch (err: unknown) {
        handleApiError(err, { 
          toast: { error: toastError },
          fallbackMessage: "Failed to load GSC overview"
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toastError]);

  const filteredClientSites = clientSites.filter(item => 
    item.domain.toLowerCase().includes(search.toLowerCase()) || 
    item.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInternalSites = internalSites.filter(item => 
    item.domain.toLowerCase().includes(search.toLowerCase()) || 
    item.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const renderCard = (item: GscOverviewItem) => (
    <div key={item.id} style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 2px 0", color: "#0F172A" }}>{item.clientName}</h3>
          <a href={`https://${item.domain}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#64748B", textDecoration: "none" }}>https://{item.domain}/</a>
        </div>
        <span style={{ 
          background: item.isConnected !== false ? "#DCFCE7" : "#F1F5F9", 
          color: item.isConnected !== false ? "#15803D" : "#64748B", 
          padding: "2px 8px", 
          borderRadius: "12px", 
          fontSize: "11px", 
          fontWeight: "700" 
        }}>
          {item.isConnected !== false ? "Active" : "Offline"}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#3B82F6" }}>{item.clicks.toLocaleString()}</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Clicks</div>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#8B5CF6" }}>{item.impressions.toLocaleString()}</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Impressions</div>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>{item.avgPosition}</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Avg Pos</div>
        </div>
      </div>

      <div style={{ height: "60px", width: "100%", marginTop: "4px" }}>
        {item.chartData && item.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.chartData}>
              <XAxis dataKey="date" hide />
              <Tooltip
                contentStyle={{
                  background: "#1F2937",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "11px",
                  padding: "8px 12px"
                }}
                itemStyle={{ color: "white" }}
              />
              <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#8B5CF6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "12px", background: "#F8FAFC", borderRadius: "4px" }}>
            No sync data yet
          </div>
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
        <Link 
          href={`/admin/gsc/${item.id}`} 
          style={{ 
            fontSize: "12px", 
            color: "#64748B",
            textDecoration: "none", 
            display: "flex", 
            alignItems: "center", 
            gap: "4px"
          }}
        >
          View analysis &rarr;
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>
      <div className={styles.headerRow} style={{ marginBottom: "24px" }}>
        <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600" }}>GSC Intelligence</h1>
        <Link href="/admin/gsc/settings" className={styles.btnSecondary} style={{ fontSize: "14px", padding: "6px 12px", textDecoration: "none" }}>Settings</Link>
      </div>

      <div style={{ marginBottom: "32px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#888" }} />
          <input
            type="text"
            placeholder="Search by domain or client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "14px" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        <span style={{ color: "#0F172A" }}>CLIENT SITES</span>
        <span style={{ color: "#64748B" }}>{filteredClientSites.length} CLIENTS</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <Loader2 className={styles.emptyIcon} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            {filteredClientSites.map(renderCard)}
          </div>

          {filteredInternalSites.length > 0 && (
            <>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ color: "#0F172A" }}>INTERNAL SITES</span>
                <span style={{ color: "#64748B" }}>{filteredInternalSites.length} SITES</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
                {filteredInternalSites.map(renderCard)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
