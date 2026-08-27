"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, Plus, AlertCircle, Eye } from "lucide-react";

interface ContentPiece {
  id: string;
  page: string;
  title: string;
  topicAngle: string;
  score: number | null;
  strategy: string;
  status: "Scored" | "In Queue" | "Pending" | "Complete";
}

interface ContentLinkabilityData {
  alert: string;
  clients: Array<{ id: string; name: string }>;
  contentPieces: ContentPiece[];
}

export default function ContentLinkabilityScoringPage() {
  const [data, setData] = useState<ContentLinkabilityData | null>(null);
  const [selectedClient, setSelectedClient] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/content");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load content scoring:", err);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const getScoreCircle = (score: number | null) => {
    if (score === null) {
      return (
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#CBD5E1", color: "white", fontSize: "11px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          &mdash;
        </div>
      );
    }
    const bg = score >= 7 ? "#10B981" : score >= 5 ? "#F59E0B" : "#EF4444";
    return (
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: bg, color: "white", fontSize: "11px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {score}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scored":
        return <span style={{ background: "#ECFDF5", color: "#065F46", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>Scored</span>;
      case "In Queue":
        return <span style={{ background: "#F5F3FF", color: "#6D28D9", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>In Queue</span>;
      case "Pending":
        return <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>Pending</span>;
      case "Complete":
        return <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>Complete</span>;
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
        Content scoring data unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
              <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building</Link>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Content Linkability Scoring
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Score new content for link potential and route to the right outreach strategy
            </p>
          </div>

          <button
            type="button"
            style={{
              background: "#0F4C5C",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={14} /> + Add Content Piece
          </button>
        </div>

        {/* Yellow Alert Banner */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "24px",
            color: "#92400E",
            fontSize: "12.5px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{data.alert}</span>
            <span style={{ fontWeight: "700", textDecoration: "underline", cursor: "pointer" }}>Review</span>
          </div>
          <span style={{ cursor: "pointer", color: "#92400E" }}>&times;</span>
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option value="All">All Statuses</option>
            <option value="Scored">Scored</option>
            <option value="In Queue">In Queue</option>
            <option value="Pending">Pending</option>
            <option value="Complete">Complete</option>
          </select>

          <select
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option>All Scores</option>
          </select>

          <select
            style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}
          >
            <option>All Outreach Types</option>
          </select>
        </div>

        {/* Content Pieces Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>Content Pieces</span>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>{data.contentPieces.length} pieces</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#0F4C5C", color: "white" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>PAGE</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>TOPIC / ANGLE</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>SCORE</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>RECOMMENDED STRATEGY</th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>STATUS</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.contentPieces.map((cp) => (
                <tr key={cp.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: "700", color: "#0F172A" }}>{cp.page}</div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>{cp.title}</div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569" }}>
                    {cp.topicAngle}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    {getScoreCircle(cp.score)}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#334155", fontWeight: "500" }}>
                    {cp.strategy}
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    {getStatusBadge(cp.status)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "10px", fontSize: "11.5px" }}>
                      {cp.status === "Pending" ? (
                        <span style={{ color: "#0F4C5C", fontWeight: "700", cursor: "pointer" }}>Score Now</span>
                      ) : cp.status !== "Complete" && cp.status !== "In Queue" ? (
                        <span style={{ color: "#0F4C5C", fontWeight: "700", cursor: "pointer" }}>Start Prospecting</span>
                      ) : null}
                      <span style={{ color: "#64748B", cursor: "pointer" }}>View</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
