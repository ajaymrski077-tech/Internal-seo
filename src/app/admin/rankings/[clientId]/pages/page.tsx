"use client";

import { use, useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, Loader2, Star, ArrowUpRight } from "lucide-react";

interface PageOverviewItem {
  page: string;
  keywords: number;
  avgPos: number | null;
  delta: number;
  top10: number;
  onPageScore: number | null;
  linksBuilt: number;
  flag: string | null;
  isKeyPage: boolean;
}

interface PagesOverviewData {
  client: {
    id: string;
    name: string;
    domain: string;
  };
  pages: PageOverviewItem[];
}

export default function ClientPagesOverviewPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<PagesOverviewData | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings/${resolvedParams.clientId}/pages`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load client pages:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedParams.clientId]);

  const toggleStarKeyPage = (pageName: string) => {
    if (!data) return;
    setData({
      ...data,
      pages: data.pages.map(p => p.page === pageName ? { ...p, isKeyPage: !p.isKeyPage } : p)
    });
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
        <p style={{ color: "#64748B" }}>Client pages data unavailable.</p>
        <Link href="/admin/rankings" style={{ color: "#0F4C5C", textDecoration: "none" }}>
          &larr; Back to Rankings
        </Link>
      </div>
    );
  }

  const keyPagesCount = data.pages.filter(p => p.isKeyPage).length;
  const filteredPages = data.pages.filter(p =>
    p.page.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Title & Subtitle */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Pages overview &mdash; {data.client.name}
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, maxWidth: "1000px", lineHeight: "1.5" }}>
            The planning board: each page's rank, on-page score and links built in one place. The site-wide link gap is the prospect pool (open it below); the per-page numbers are here to inform the plan, not to prescribe link counts.
          </p>
        </div>

        {/* Action Controls Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", width: "220px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "9px", color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Search pages..."
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

            <button
              type="button"
              style={{
                background: "#0F4C5C",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Set monthly plan
            </button>

            <Link
              href={`/admin/links/${data.client.id}`}
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              Site link gap (prospect pool) &rarr;
            </Link>

            <Link
              href={`/admin/rankings/${data.client.id}`}
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              Rank detail &rarr;
            </Link>

            <button
              type="button"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Run page-matching (AI)
            </button>
          </div>

          <div style={{ color: "#94A3B8", fontSize: "12px" }}>
            Run matching to flag cannibalisation
          </div>
        </div>

        {/* Yellow Star Key Page Banner */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "20px",
            color: "#92400E",
            fontSize: "12.5px",
            lineHeight: "1.5",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <Star size={16} fill="#F59E0B" color="#F59E0B" style={{ flexShrink: 0 }} />
          <div>
            <strong>Star a page to mark it as a key page.</strong> one of THE pages that drive leads for this client (home, core service pages, calculators). Rank band-exit alerts and review packs watch the keywords on starred pages. This client has {keyPagesCount} key page{keyPagesCount === 1 ? "" : "s"}.
          </div>
        </div>

        {/* Pages Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#94A3B8" }}>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>KEY PAGE</th>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>PAGE</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>KEYWORDS</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>AVG POS</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>TOP 10</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>ON-PAGE</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>LINKS BUILT</th>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>FLAG</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((item, idx) => {
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 18px" }}>
                      <button
                        type="button"
                        onClick={() => toggleStarKeyPage(item.page)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <Star
                          size={15}
                          fill={item.isKeyPage ? "#F59E0B" : "none"}
                          color={item.isKeyPage ? "#F59E0B" : "#CBD5E1"}
                        />
                      </button>
                    </td>
                    <td style={{ padding: "12px 18px", color: "#1E293B", fontWeight: "500" }}>
                      {item.page}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right", color: "#334155" }}>
                      {item.keywords}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>
                      {item.avgPos ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: item.avgPos <= 15 ? "#FEF3C7" : "#F1F5F9", color: item.avgPos <= 15 ? "#92400E" : "#334155", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                          <span>{item.avgPos}</span>
                          {item.delta > 0 && <span style={{ color: "#059669", fontSize: "11px" }}>▲{item.delta}</span>}
                          {item.delta < 0 && <span style={{ color: "#DC2626", fontSize: "11px" }}>▼{Math.abs(item.delta)}</span>}
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right", color: "#334155" }}>
                      {item.top10}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>
                      {item.onPageScore ? (
                        <span style={{ color: "#059669", fontWeight: "700" }}>{item.onPageScore}</span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right", color: "#334155" }}>
                      {item.linksBuilt}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      {item.flag && (
                        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>
                          {item.flag}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>
                      <Link
                        href={`/admin/rankings/${data.client.id}?page=${encodeURIComponent(item.page)}`}
                        style={{ color: "#64748B", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
                      >
                        timeline <ArrowUpRight size={12} />
                      </Link>
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
