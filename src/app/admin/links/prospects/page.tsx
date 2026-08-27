"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, Loader2, Plus, AlertTriangle, ArrowRight } from "lucide-react";

interface PipelineCampaign {
  name: string;
  type: string;
  prospects: number;
}

interface PipelineClient {
  id: string;
  name: string;
  badge: string;
  accent: "green" | "orange" | "red";
  campaigns: PipelineCampaign[];
  queue: number;
  awaiting: number;
  ready: number;
  secured: number;
  lastActivity: string;
  stuckAlert: string | null;
}

interface ProspectPipelineData {
  summary: {
    activeCampaigns: number;
    prospectsInQueue: number;
    awaitingContactInfo: number;
    readyToEmail: number;
  };
  clients: PipelineClient[];
}

export default function ProspectPipelinePage() {
  const [data, setData] = useState<ProspectPipelineData | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPipeline = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/prospects/pipeline");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load prospect pipeline:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPipeline();
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "Link Insert":
        return { bg: "#EFF6FF", color: "#1D4ED8" };
      case "Citation":
        return { bg: "#FFF7ED", color: "#C2410C" };
      case "Guest Post":
        return { bg: "#FAF5FF", color: "#7E22CE" };
      case "Journalist / PR":
        return { bg: "#FEF9C3", color: "#A16207" };
      case "Resource Page":
        return { bg: "#ECFDF5", color: "#047857" };
      default:
        return { bg: "#F1F5F9", color: "#475569" };
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
        Pipeline data unavailable.
      </div>
    );
  }

  const filteredClients = data.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <Link href="/admin/links" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-block", marginBottom: "4px" }}>
              &larr; Link Building Hub
            </Link>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Prospect Pipeline
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Active link building pipeline across all clients
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
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={15} /> + New Brief
          </button>
        </div>

        {/* 4 Top KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.activeCampaigns}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Active campaigns
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.prospectsInQueue}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Prospects in queue
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#D97706", lineHeight: "1" }}>
              {data.summary.awaitingContactInfo}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Awaiting contact info
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669", lineHeight: "1" }}>
              {data.summary.readyToEmail}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Ready to email
            </div>
          </div>
        </div>

        {/* Amber Alert Banner */}
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
            <span>2 clients need attention &mdash; prospects awaiting review for 5+ days.</span>
          </div>
          <span style={{ color: "#92400E", fontWeight: "700", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}>
            Sort to top
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "9px", color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Search clients..."
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

            <select
              style={{
                padding: "6px 12px",
                fontSize: "12.5px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                color: "#334155"
              }}
            >
              <option>All clients</option>
            </select>
          </div>

          <div style={{ fontSize: "12px", color: "#94A3B8" }}>
            Showing {filteredClients.length} clients
          </div>
        </div>

        {/* Client Pipeline Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredClients.map((client) => {
            const borderAccent = client.accent === "green" ? "#10B981" : client.accent === "orange" ? "#F59E0B" : "#EF4444";

            return (
              <div
                key={client.id}
                style={{
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  borderLeft: `4px solid ${borderAccent}`,
                  padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                {/* Client Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>{client.name}</span>
                    <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: "11px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }}>
                      {client.badge}
                    </span>
                  </div>

                  <Link
                    href={`/admin/links/${client.id}`}
                    style={{ color: "#0F4C5C", fontSize: "12.5px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    View pipeline &rarr;
                  </Link>
                </div>

                {/* Content: Campaigns & Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "24px", alignItems: "center" }}>
                  
                  {/* Active Campaigns list */}
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginBottom: "8px" }}>
                      ACTIVE CAMPAIGNS
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {client.campaigns.map((camp, idx) => {
                        const styleType = getTypeStyle(camp.type);
                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                            <span style={{ color: "#334155", fontWeight: "500" }}>{camp.name}</span>
                            <span style={{ background: styleType.bg, color: styleType.color, padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: "700" }}>
                              {camp.type}
                            </span>
                            <span style={{ color: "#94A3B8", fontSize: "11.5px" }}>{camp.prospects} prospects</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2 stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>{client.queue}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>Prospects in queue</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: client.awaiting > 0 ? "#D97706" : "#0F172A" }}>{client.awaiting}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>Awaiting contact info</div>
                    </div>
                  </div>

                  {/* Column 3 stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#059669" }}>{client.ready}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>Ready to email</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>{client.secured}</div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>Links secured this month</div>
                    </div>
                  </div>

                </div>

                {/* Footer bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "12px", marginTop: "16px", fontSize: "11.5px", color: "#94A3B8" }}>
                  <div>
                    {client.stuckAlert ? (
                      <span style={{ color: "#DC2626", fontWeight: "600" }}>{client.stuckAlert}</span>
                    ) : (
                      <span>Last activity: {client.lastActivity}</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{ color: "#64748B", cursor: "pointer" }}>New brief</span>
                    <span>&middot;</span>
                    <span style={{ color: "#64748B", cursor: "pointer" }}>View queue</span>
                    <span>&middot;</span>
                    <span style={{ color: "#64748B", cursor: "pointer" }}>View campaigns</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
