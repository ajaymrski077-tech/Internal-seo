"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import { handleApiError } from "@/lib/apiUtils";
import { useToast } from "@/components/ToastContext";
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis } from "recharts";

interface GscOverviewItem {
  id: number;
  domain: string;
  clientId: number;
  clientName: string;
  clicks: number;
  impressions: number;
  avgPosition: string;
  chartData: { date: string; clicks: number; impressions: number }[];
}

export default function GscOverviewPage() {
  const { error: toastError } = useToast();
  const [data, setData] = useState<GscOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/gsc/overview");
        if (!res.ok) throw new Error("Failed to load GSC overview");
        const json = await res.json();
        setData(json.data || []);
      } catch (err: any) {
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

  const filteredData = data.filter(item => 
    item.domain.toLowerCase().includes(search.toLowerCase()) || 
    item.clientName.toLowerCase().includes(search.toLowerCase())
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

      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        <span style={{ color: "var(--text-primary)" }}>CLIENT SITES</span>
        <span>{filteredData.length} CLIENTS</span>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <Loader2 className={styles.emptyIcon} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
          {filteredData.map(item => (
            <div key={item.id} style={{ background: "white", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 4px 0", color: "var(--text-primary)" }}>{item.clientName}</h3>
                  <a href={`https://${item.domain}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--brand-primary)", textDecoration: "none" }}>https://{item.domain}/</a>
                </div>
                <span style={{ background: "var(--success-light)", color: "var(--success-dark)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>Active</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#3B82F6" }}>{item.clicks.toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Clicks</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#8B5CF6" }}>{item.impressions.toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Impressions</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>{item.avgPosition}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Avg Pos</div>
                </div>
              </div>

              <div style={{ height: "60px", width: "100%", marginTop: "8px" }}>
                {item.chartData.length > 0 ? (
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
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          padding: "8px 12px"
                        }}
                        itemStyle={{ color: "white" }}
                        labelFormatter={(value) => {
                          if (typeof value === "string" || typeof value === "number") {
                            return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                          }
                          return "";
                        }}
                      />
                      <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="impressions" name="Impressions" stroke="#8B5CF6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px", background: "var(--bg-secondary)", borderRadius: "4px" }}>
                    No sync data yet
                  </div>
                )}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <Link 
                  href={`/admin/gsc/${item.id}`} 
                  className={styles.btnSecondary} 
                  style={{ 
                    fontSize: "12px", 
                    textDecoration: "none", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "4px",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  View analysis &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
