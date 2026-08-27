"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, Loader2, ArrowUpRight, Upload, Plus, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";

interface TrackedLinkRow {
  id: string;
  clientCode: string;
  sourceUrl: string;
  anchor: string;
  targetPage: string;
  dr: number;
  drDelta: number;
  traffic: string;
  type: string;
  follow: "DF" | "NF";
  cost: string;
  assigned: string;
  date: string;
  ahrefsStatus: "Confirmed" | "Not detected" | "Pending" | "HTTP only";
}

interface LinkTrackerData {
  summary: {
    totalTracked: number;
    confirmedAhrefs: number;
    lostNotDetected: number;
    untrackedDiscovered: number;
    lastAhrefsImport: string;
    lastHttpCheck: string;
  };
  clients: Array<{ id: string; name: string }>;
  trackedLinks: TrackedLinkRow[];
}

export default function LinkTrackerPage() {
  const [data, setData] = useState<LinkTrackerData | null>(null);
  const [activeTab, setActiveTab] = useState<"Tracked Links" | "Discovered" | "Import History">("Tracked Links");
  const [selectedClient, setSelectedClient] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracker = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/tracker");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load link tracker:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTracker();
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "Link Insert":
        return { bg: "#EFF6FF", color: "#1D4ED8" };
      case "Guest Post":
        return { bg: "#FAF5FF", color: "#7E22CE" };
      case "Resource Page":
        return { bg: "#ECFDF5", color: "#047857" };
      case "Natural":
        return { bg: "#FEF3C7", color: "#92400E" };
      case "Niche Edit":
        return { bg: "#ECFDF5", color: "#047857" };
      case "Citation":
        return { bg: "#EFF6FF", color: "#1D4ED8" };
      default:
        return { bg: "#F1F5F9", color: "#475569" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <span style={{ background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>&check; Confirmed</span>;
      case "Not detected":
        return <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>&times; Not detected</span>;
      case "Pending":
        return <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>&bull; Pending</span>;
      case "HTTP only":
        return <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>HTTP only</span>;
      default:
        return null;
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
        Link tracker data unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
              <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building</Link>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Link Tracker
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Live backlinks secured through outreach &mdash; verified monthly via Ahrefs
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
              Check Health
            </button>
            <button style={{ background: "#0F4C5C", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <Upload size={13} /> Upload Ahrefs Export
            </button>
            <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <Plus size={13} /> Log Link Manually
            </button>
            <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
              Run HTTP Check
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.totalTracked}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>
              Total links tracked &mdash; all time
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#059669", lineHeight: "1" }}>
              {data.summary.confirmedAhrefs}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>
              Confirmed in Ahrefs
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#DC2626", lineHeight: "1" }}>
              {data.summary.lostNotDetected}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>
              Lost / not detected
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#D97706", lineHeight: "1" }}>
              {data.summary.untrackedDiscovered}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>
              Untracked discovered &mdash; found in Ahrefs
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.lastAhrefsImport}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>
              Last Ahrefs import
            </div>
          </div>
        </div>

        {/* Yellow Warning Banner */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "20px",
            color: "#92400E",
            fontSize: "12.5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={15} color="#D97706" />
            <span>9 links found in your latest Ahrefs import that aren&apos;t in your link database. Review and add them below.</span>
          </div>
          <span style={{ fontWeight: "700", textDecoration: "underline", cursor: "pointer" }}>
            Review Now &rarr;
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "20px", borderBottom: "1px solid #E2E8F0", marginBottom: "16px", fontSize: "13.5px" }}>
          {(["Tracked Links", "Discovered", "Import History"] as const).map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                paddingBottom: "8px",
                borderBottom: activeTab === t ? "2px solid #0F4C5C" : "none",
                color: activeTab === t ? "#0F172A" : "#64748B",
                fontWeight: activeTab === t ? "700" : "500",
                cursor: "pointer"
              }}
            >
              {t} {t === "Discovered" ? "(9)" : ""}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option value="All">All clients</option>
            {data.clients.map(c => <option key={c.id}>{c.name}</option>)}
          </select>

          <select style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}>
            <option>All link types</option>
          </select>

          <select style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}>
            <option>All statuses</option>
          </select>

          <select style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}>
            <option>All sources</option>
          </select>

          <input
            type="text"
            placeholder="dd-mm-yyyy"
            style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px", width: "110px", background: "white" }}
          />

          <div style={{ position: "relative", width: "220px", marginLeft: "auto" }}>
            <Search size={13} style={{ position: "absolute", left: "10px", top: "9px", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                fontSize: "12px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>Tracked Links</span>
            <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
              Last Ahrefs import: {data.summary.lastAhrefsImport} &middot; Last HTTP check: {data.summary.lastHttpCheck}
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#0F4C5C", color: "white" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>Client</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>Source URL</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>Anchor</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>Target Page</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>DR</th>
                <th style={{ padding: "10px 10px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>Traffic</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>Type</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>Follow</th>
                <th style={{ padding: "10px 10px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>Cost</th>
                <th style={{ padding: "10px 10px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>Assigned</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>Date</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>Ahrefs status</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.trackedLinks.map((tl) => {
                const typeStyle = getTypeStyle(tl.type);

                return (
                  <tr key={tl.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: "700", color: "#0F172A" }}>
                      {tl.clientCode}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#1E293B", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tl.sourceUrl}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontStyle: "italic", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tl.anchor}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tl.targetPage}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center", fontWeight: "700" }}>
                      <span style={{ color: tl.dr >= 50 ? "#059669" : "#D97706" }}>{tl.dr}</span>
                      {tl.drDelta > 0 && <span style={{ color: "#059669", fontSize: "10px" }}>▲{tl.drDelta}</span>}
                      {tl.drDelta < 0 && <span style={{ color: "#DC2626", fontSize: "10px" }}>▼{Math.abs(tl.drDelta)}</span>}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", color: "#64748B" }}>
                      {tl.traffic}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{ background: typeStyle.bg, color: typeStyle.color, padding: "2px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                        {tl.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: "#059669", fontWeight: "700", fontSize: "11px" }}>
                      {tl.follow}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", color: "#334155" }}>
                      {tl.cost}
                    </td>
                    <td style={{ padding: "10px 10px", color: "#64748B" }}>
                      {tl.assigned}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: "#94A3B8" }}>
                      {tl.date}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      {getStatusBadge(tl.ahrefsStatus)}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", fontSize: "11px" }}>
                        <span style={{ color: "#0F4C5C", cursor: "pointer" }}>Verify</span>
                        <span>&middot;</span>
                        <span style={{ color: "#64748B", cursor: "pointer" }}>Edit</span>
                        <span>&middot;</span>
                        <span style={{ color: "#64748B", cursor: "pointer" }}>Chain &nearr;</span>
                        <span>&middot;</span>
                        <span style={{ color: "#DC2626", cursor: "pointer" }}>Remove</span>
                      </div>
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
