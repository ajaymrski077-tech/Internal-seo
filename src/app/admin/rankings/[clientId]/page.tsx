"use client";

import { use, useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, Loader2, RefreshCw, Star, ArrowUpRight, ExternalLink } from "lucide-react";

interface KeywordRankRow {
  id: string;
  keyword: string;
  vol: number | null;
  d90: number | null;
  d30: number | null;
  d7: number | null;
  now: number | null;
  delta: number;
  best: string;
  lastRank?: string | null;
  page: string;
  trend?: number[];
}

interface RankTrackerData {
  client: {
    id: string;
    name: string;
    domain: string;
    lastSynced: string;
  };
  summary: {
    tracked: number;
    top3: number;
    top10: number;
    avgPos: number;
    notRanking: number;
  };
  keywords: KeywordRankRow[];
}

function MiniTrendSvg({ trend }: { trend?: number[] }) {
  if (!trend || trend.length < 2) return <span style={{ color: "#94A3B8" }}>&mdash;</span>;
  const width = 60;
  const height = 18;
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min || 1;

  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * width;
    const y = ((v - min) / range) * (height - 4) + 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        fill="none"
        stroke="#0F4C5C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function ClientRankTrackerPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<RankTrackerData | null>(null);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "page">("none");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rankings/${resolvedParams.clientId}/detail`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load rank tracker:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.clientId]);

  const handleSyncLatest = async () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      loadData();
    }, 1200);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <PageLoader message="Loading..." showSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#64748B" }}>Client ranking data unavailable.</p>
        <Link href="/admin/rankings" style={{ color: "#0F4C5C", textDecoration: "none" }}>
          &larr; Back to Rankings
        </Link>
      </div>
    );
  }

  const filteredKeywords = data.keywords.filter(k =>
    k.keyword.toLowerCase().includes(search.toLowerCase()) ||
    k.page.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: "8px" }}>
          <Link href="/admin/rankings" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none" }}>
            &larr; All rankings
          </Link>
        </div>

        {/* Header Title & Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Rank Tracker &mdash; {data.client.name}
            </h1>
            <p style={{ color: "#64748B", fontSize: "12.5px", margin: 0 }}>
              Tracked positions from SE Ranking (<a href={data.client.domain.startsWith("http") ? data.client.domain : `https://${data.client.domain}`} target="_blank" rel="noreferrer" style={{ color: "#64748B", textDecoration: "underline" }}>{data.client.domain}</a>) &middot; last synced {data.client.lastSynced} &middot; {data.summary.tracked} keywords tracked
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href={`/admin/rankings/${data.client.id}/pages`}
              style={{
                background: "#0F4C5C",
                color: "white",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Star size={13} fill="white" /> Pages &amp; key pages
            </Link>

            <button
              onClick={handleSyncLatest}
              disabled={syncing}
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} /> Sync latest
            </button>
          </div>
        </div>

        {/* 5 KPI Cards in a row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.tracked}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "6px" }}>
              TRACKED
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669", lineHeight: "1" }}>
              {data.summary.top3}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "6px" }}>
              TOP 3
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669", lineHeight: "1" }}>
              {data.summary.top10}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "6px" }}>
              TOP 10
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.avgPos}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "6px" }}>
              AVG POS
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#DC2626", lineHeight: "1" }}>
              {data.summary.notRanking}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "6px" }}>
              NOT RANKING
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
            <span style={{ color: "#64748B" }}>Group by:</span>
            <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: "6px", padding: "2px" }}>
              <button
                type="button"
                onClick={() => setGroupBy("none")}
                style={{
                  background: groupBy === "none" ? "white" : "transparent",
                  color: groupBy === "none" ? "#0F172A" : "#64748B",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: groupBy === "none" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                }}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("page")}
                style={{
                  background: groupBy === "page" ? "white" : "transparent",
                  color: groupBy === "page" ? "#0F172A" : "#64748B",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: groupBy === "page" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                }}
              >
                Target page
              </button>
            </div>
          </div>

          <div style={{ position: "relative", width: "240px" }}>
            <Search size={13} style={{ position: "absolute", left: "10px", top: "9px", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                fontSize: "12.5px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Keywords Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#94A3B8" }}>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>KEYWORD</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>VOL</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>90D</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>30D</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>7D</th>
                <th style={{ padding: "12px 18px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>NOW</th>
                <th style={{ padding: "12px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>TREND (14)</th>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>BEST</th>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>TARGET PAGE</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((k, idx) => {
                const isTop3 = k.now && k.now <= 3;
                const isTop10 = k.now && k.now <= 10;
                const isTop20 = k.now && k.now <= 20;

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 18px", color: "#1E293B", fontWeight: "500" }}>
                      &bull; {k.keyword}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: "#64748B" }}>
                      {k.vol ? k.vol.toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: "#94A3B8" }}>
                      {k.d90 || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: "#94A3B8" }}>
                      {k.d30 || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", color: "#94A3B8" }}>
                      {k.d7 || "—"}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "center" }}>
                      {k.now ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontWeight: "700",
                            fontSize: "12px",
                            background: isTop3 ? "#D1FAE5" : isTop20 ? "#FEF3C7" : "#F1F5F9",
                            color: isTop3 ? "#065F46" : isTop20 ? "#92400E" : "#334155"
                          }}
                        >
                          <span>{k.now}</span>
                          {k.delta > 0 && <span style={{ color: "#059669", fontSize: "11px" }}>▲{k.delta}</span>}
                          {k.delta < 0 && <span style={{ color: "#DC2626", fontSize: "11px" }}>▼{Math.abs(k.delta)}</span>}
                        </div>
                      ) : (
                        <div style={{ display: "inline-block", fontSize: "11px", color: "#94A3B8" }}>
                          {k.delta !== 0 && (
                            <span style={{ color: k.delta > 0 ? "#059669" : "#DC2626", fontWeight: "700", marginRight: "4px" }}>
                              {k.delta > 0 ? `▲${k.delta}` : `▼${Math.abs(k.delta)}`}
                            </span>
                          )}
                          <span style={{ border: "1px solid #E2E8F0", borderRadius: "3px", padding: "1px 4px" }}>
                            {k.lastRank || "—"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <MiniTrendSvg trend={k.trend} />
                    </td>
                    <td style={{ padding: "12px 18px", color: "#64748B", fontSize: "12px" }}>
                      {k.best}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#475569", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {k.page}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
