"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, Settings, RefreshCw, Check, Undo2 } from "lucide-react";

interface CompetitorBacklink {
  id: string;
  domain: string;
  path: string;
  dr: number;
  traffic: string;
  linkType: string;
  quality: "Good" | "Review" | "Reject";
  firstSeen: string;
  status: "New" | "Reviewed" | "In Queue" | "Ignored";
  inQueue: boolean;
}

interface CompetitorTrackingData {
  summary: {
    totalLinks: number;
    newSinceLastCheck: number;
    worthPursuing: number;
    inProspectQueue: number;
  };
  clients: Array<{ id: string; name: string }>;
  backlinks: CompetitorBacklink[];
}

export default function CompetitorLinkTrackingPage() {
  const [data, setData] = useState<CompetitorTrackingData | null>(null);
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/links/competitors?client=${selectedClient}&type=${selectedType}&status=${selectedStatus}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load competitor links:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClient, selectedType, selectedStatus]);

  const handleRunCheck = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      loadData();
    }, 1000);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "Guest Post":
        return { bg: "#FAF5FF", color: "#7E22CE" };
      case "Link Insert":
        return { bg: "#EFF6FF", color: "#1D4ED8" };
      case "Resource Page":
        return { bg: "#ECFDF5", color: "#047857" };
      case "Citation":
        return { bg: "#FFF7ED", color: "#C2410C" };
      case "Toxic":
        return { bg: "#FEF2F2", color: "#DC2626" };
      case "Press":
        return { bg: "#F0FDFA", color: "#0F766E" };
      default:
        return { bg: "#F1F5F9", color: "#475569" };
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "Good":
        return "#059669";
      case "Review":
        return "#D97706";
      case "Reject":
        return "#DC2626";
      default:
        return "#64748B";
    }
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
      <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
        Competitor tracking data unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header Title & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
              <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building</Link>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Competitor Link Tracking
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Monthly backlink discovery across client competitors
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Settings size={14} /> Manage Competitors
            </button>

            <button
              onClick={handleRunCheck}
              disabled={refreshing}
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> Run Check Now
            </button>

            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                padding: "7px 14px",
                fontSize: "12.5px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                color: "#334155"
              }}
            >
              <option value="All">All Clients</option>
              {data.clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.totalLinks}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Total links this month
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.newSinceLastCheck}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              New since last check
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.worthPursuing}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Worth pursuing
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.inProspectQueue}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Already in prospect queue
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option value="All">All Clients</option>
            {data.clients.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option>All Competitors</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option value="All">All Link Types</option>
            <option value="Guest Post">Guest Post</option>
            <option value="Link Insert">Link Insert</option>
            <option value="Resource Page">Resource Page</option>
            <option value="Citation">Citation</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Queue">In Queue</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Ignored">Ignored</option>
          </select>

          <input
            type="text"
            placeholder="dd-mm-yyyy"
            style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px", width: "110px", background: "white" }}
          />
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>to</span>
          <input
            type="text"
            placeholder="dd-mm-yyyy"
            style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px", width: "110px", background: "white" }}
          />
        </div>

        {/* Table: Discovered Backlinks */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>Discovered Backlinks</span>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Showing 12 of {data.summary.totalLinks} results</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#0F4C5C", color: "white" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>REFERRING DOMAIN</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>DR</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>TRAFFIC</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>LINK TYPE</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>QUALITY</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>FIRST SEEN</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>STATUS</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.backlinks.map((b) => {
                const typeStyle = getTypeStyle(b.linkType);
                const qualityColor = getQualityColor(b.quality);
                const isDrHigh = b.dr >= 50;
                const isDrMed = b.dr >= 30 && b.dr < 50;

                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: "600", color: "#0F172A" }}>{b.domain}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>{b.path}</div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "700", color: isDrHigh ? "#059669" : isDrMed ? "#D97706" : "#64748B" }}>
                      {b.dr}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>
                      {b.traffic}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: typeStyle.bg, color: typeStyle.color, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                        {b.linkType}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", color: qualityColor }}>
                      {b.quality}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#94A3B8", fontSize: "11.5px" }}>
                      {b.firstSeen}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ background: b.status === "New" ? "#CCFBF1" : b.status === "In Queue" ? "#F3E8FF" : "#F1F5F9", color: b.status === "New" ? "#0F766E" : b.status === "In Queue" ? "#6B21A8" : "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      {b.inQueue ? (
                        <span style={{ color: "#059669", fontSize: "11.5px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                          <Check size={13} /> In Queue
                        </span>
                      ) : b.status === "Ignored" ? (
                        <span style={{ color: "#0F4C5C", fontSize: "11.5px", fontWeight: "600", cursor: "pointer" }}>
                          Restore
                        </span>
                      ) : (
                        <div style={{ display: "inline-flex", gap: "10px", fontSize: "11.5px" }}>
                          <span style={{ color: "#0F4C5C", fontWeight: "600", cursor: "pointer" }}>Add to Queue</span>
                          <span style={{ color: "#DC2626", cursor: "pointer" }}>Ignore</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* View Monthly Digest toggle */}
        <div style={{ fontSize: "12.5px", color: "#64748B", cursor: "pointer" }}>
          View monthly digest &blacktriangledown;
        </div>

      </div>
    </div>
  );
}
