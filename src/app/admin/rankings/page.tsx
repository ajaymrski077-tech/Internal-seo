"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, Star } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface RankingSiteItem {
  id: string;
  propertyId: string | null;
  name: string;
  domain: string;
  keywords: number;
  avgPosition: number;
  avgPositionDelta: number;
  top3: number;
  top10: number;
  vsYesterday: { up: number; down: number };
  sparkline: number[];
  lastSynced: string;
}

interface RankingsOverviewData {
  clientSites: RankingSiteItem[];
  internalSites: RankingSiteItem[];
  totalTracked: number;
}

function SparklineSvg({ data }: { data: number[] }) {
  if (!data || data.length < 2) return <div style={{ width: "90px", height: "24px" }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 90;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      // In rankings, lower number is better (top of chart), but standard graph is reversed
      const y = ((val - min) / range) * (height - 6) + 3;
      return `${x},${y}`;
    })
    .join(" ");

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

export default function RankingsOverviewPage() {
  const [data, setData] = useState<RankingsOverviewData | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "keywords" | "movement">("name");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/rankings/overview");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load rankings overview:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  const filterAndSort = (sites: RankingSiteItem[]) => {
    let list = sites.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.domain.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "keywords") {
      list.sort((a, b) => b.keywords - a.keywords);
    } else if (sortBy === "movement") {
      list.sort((a, b) => Math.abs(b.avgPositionDelta) - Math.abs(a.avgPositionDelta));
    }
    return list;
  };

  const clientSites = data ? filterAndSort(data.clientSites) : [];
  const internalSites = data ? filterAndSort(data.internalSites) : [];
  const totalActiveSites = (data?.clientSites.length || 0) + (data?.internalSites.length || 0);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Rankings
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
            Cross-client snapshot from SE Ranking &mdash; 30-day trend and yesterday's moves. {totalActiveSites} active sites.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px 7px 30px",
                fontSize: "13px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none",
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "7px 12px",
              fontSize: "13px",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              background: "white",
              outline: "none",
              color: "#334155"
            }}
          >
            <option value="name">Sort A-Z</option>
            <option value="keywords">Sort by Keywords</option>
            <option value="movement">Sort by Movement</option>
          </select>
        </div>

        {loading ? (
          <PageLoader message="Loading Rankings" subtitle="Fetching keyword positions" showSkeleton />
        ) : (
          <>
            {/* Section 1: Client sites */}
            <div style={{ marginBottom: "36px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "12px" }}>
                Client sites ({clientSites.length})
              </h2>

              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                      <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11.5px" }}>CLIENT</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>KEYWORDS</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>AVG POSITION</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>TOP 3</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>TOP 10</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>VS YEST.</th>
                      <th style={{ padding: "12px 18px", textAlign: "center", fontWeight: "600", fontSize: "11.5px" }}>AVG-POSITION TREND</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>LAST SYNCED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientSites.map((site) => (
                      <tr key={site.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Link href={`/admin/rankings/${site.id}`} style={{ fontWeight: "700", color: "#0F172A", textDecoration: "none" }}>
                              {site.name}
                            </Link>
                            <Link
                              href={`/admin/rankings/${site.id}/pages`}
                              style={{ color: "#64748B", fontSize: "11.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                            >
                              pages & key <Star size={11} fill="#F59E0B" color="#F59E0B" /> <ArrowUpRight size={11} />
                            </Link>
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#334155" }}>
                          {site.keywords}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          <div style={{ fontWeight: "700", color: "#0F172A" }}>
                            {site.avgPosition} <span style={{ color: site.avgPositionDelta >= 0 ? "#059669" : "#DC2626", fontSize: "11.5px" }}>{site.avgPositionDelta >= 0 ? `▲${site.avgPositionDelta}` : `▼${Math.abs(site.avgPositionDelta)}`}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>vs 30d</div>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#059669", fontWeight: "700" }}>
                          {site.top3}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#059669", fontWeight: "700" }}>
                          {site.top10}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", fontSize: "12px" }}>
                          <span style={{ color: "#059669", fontWeight: "700" }}>▲{site.vsYesterday.up}</span>{" "}
                          <span style={{ color: "#DC2626", fontWeight: "700" }}>▼{site.vsYesterday.down}</span>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "center" }}>
                          <SparklineSvg data={site.sparkline} />
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#94A3B8", fontSize: "11.5px" }}>
                          {site.lastSynced}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Internal sites */}
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "12px" }}>
                Internal sites ({internalSites.length})
              </h2>

              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                      <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11.5px" }}>CLIENT</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>KEYWORDS</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>AVG POSITION</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>TOP 3</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>TOP 10</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>VS YEST.</th>
                      <th style={{ padding: "12px 18px", textAlign: "center", fontWeight: "600", fontSize: "11.5px" }}>AVG-POSITION TREND</th>
                      <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11.5px" }}>LAST SYNCED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalSites.map((site) => (
                      <tr key={site.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Link href={`/admin/rankings/${site.id}`} style={{ fontWeight: "700", color: "#0F172A", textDecoration: "none" }}>
                              {site.name}
                            </Link>
                            <Link
                              href={`/admin/rankings/${site.id}/pages`}
                              style={{ color: "#64748B", fontSize: "11.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                            >
                              pages & key <Star size={11} fill="#F59E0B" color="#F59E0B" /> <ArrowUpRight size={11} />
                            </Link>
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#334155" }}>
                          {site.keywords}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          <div style={{ fontWeight: "700", color: "#0F172A" }}>
                            {site.avgPosition} <span style={{ color: site.avgPositionDelta >= 0 ? "#059669" : "#DC2626", fontSize: "11.5px" }}>{site.avgPositionDelta >= 0 ? `▲${site.avgPositionDelta}` : `▼${Math.abs(site.avgPositionDelta)}`}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>vs 30d</div>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#059669", fontWeight: "700" }}>
                          {site.top3}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#059669", fontWeight: "700" }}>
                          {site.top10}
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", fontSize: "12px" }}>
                          <span style={{ color: "#059669", fontWeight: "700" }}>▲{site.vsYesterday.up}</span>{" "}
                          <span style={{ color: "#DC2626", fontWeight: "700" }}>▼{site.vsYesterday.down}</span>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "center" }}>
                          <SparklineSvg data={site.sparkline} />
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", color: "#94A3B8", fontSize: "11.5px" }}>
                          {site.lastSynced}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
