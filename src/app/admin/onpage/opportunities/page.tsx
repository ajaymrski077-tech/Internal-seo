"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { TrendingUp, Search, Loader2, ArrowUpRight, ExternalLink } from "lucide-react";

interface OpportunityItem {
  id: string;
  clientName: string;
  domain: string;
  propertyId: string;
  url: string;
  keyword: string;
  currentPos: number;
  volume: number;
  potentialClicks: number;
}

export default function OpportunityWorklistPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/onpage/opportunities");
        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.opportunities || []);
        }
      } catch (err) {
        console.error("Failed to load opportunity worklist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const filtered = opportunities.filter(o =>
    o.clientName.toLowerCase().includes(search.toLowerCase()) ||
    o.keyword.toLowerCase().includes(search.toLowerCase()) ||
    o.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/admin/onpage" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-block", marginBottom: "4px" }}>
            &larr; On-Page Tools
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Opportunity Worklist
          </h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", margin: 0 }}>
            Every page ranking in striking distance (positions 4–20), ranked by potential extra monthly clicks. Straight from Search Console.
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ marginBottom: "24px", maxWidth: "340px" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "10px", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search keyword, URL or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                fontSize: "13px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
              <PageLoader message="Loading..." showSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748B" }}>
              No striking distance opportunities found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>CLIENT / DOMAIN</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>KEYWORD</th>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px" }}>TARGET URL</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}>POS</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}>SEARCH VOL</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}>EST. CLICKS GAIN</th>
                  <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: "600", color: "#0F172A" }}>{item.clientName}</div>
                      <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>{item.domain}</div>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#334155", fontWeight: "500" }}>
                      {item.keyword}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#4F46E5", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#4F46E5", textDecoration: "none" }}>
                        {item.url}
                      </a>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <span style={{ background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: "10px", fontWeight: "700", fontSize: "11.5px" }}>
                        {item.currentPos.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#64748B" }}>
                      {item.volume.toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#059669", fontWeight: "700" }}>
                      +{item.potentialClicks.toLocaleString()}/mo
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <Link
                        href={`/admin/gsc/${item.propertyId}`}
                        style={{
                          background: "white",
                          color: "#334155",
                          border: "1px solid #CBD5E1",
                          borderRadius: "6px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        Inspect in GSC <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
