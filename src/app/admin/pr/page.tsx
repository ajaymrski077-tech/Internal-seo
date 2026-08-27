"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, RefreshCw, AlertCircle } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface PipelineCard {
  id: string;
  client: string;
  angle: string;
  date: string;
  clickUpLink?: string;
  status: string;
}

export default function LocalPrPipelinePage() {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClient, setSelectedClient] = useState("All PR clients");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, campaignsRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/pr/campaigns")
      ]);

      if (clientsRes.ok) {
        const cData = await clientsRes.json();
        setClients(cData.clients || []);
      }
      if (campaignsRes.ok) {
        const campData = await campaignsRes.json();
        setCampaigns(campData.campaigns || []);
      }
    } catch (err) {
      console.error("PR Pipeline fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter campaigns by selected client
  const filteredCampaigns = campaigns.filter(c => {
    if (selectedClient === "All PR clients") return true;
    return c.client?.name === selectedClient || c.clientId === selectedClient;
  });

  // Stage Buckets
  const stageMap: Record<string, PipelineCard[]> = {
    ideas: [],
    approved: [],
    production: [],
    ready: [],
    pitched: [],
    outcome: []
  };

  filteredCampaigns.forEach((camp) => {
    const status = (camp.status || "").toUpperCase();
    const card: PipelineCard = {
      id: camp.id,
      client: camp.client?.name || "Client",
      angle: camp.campaignName,
      date: camp.targetDate ? new Date(camp.targetDate).toISOString().split("T")[0] : camp.startDate ? new Date(camp.startDate).toISOString().split("T")[0] : "Active",
      clickUpLink: "CU ↗",
      status: camp.status
    };

    if (status === "PLANNING" || status === "IDEAS" || status === "PROPOSED") {
      stageMap.ideas.push(card);
    } else if (status === "APPROVED") {
      stageMap.approved.push(card);
    } else if (status === "IN_PROGRESS" || status === "IN PRODUCTION" || status === "PRODUCTION") {
      stageMap.production.push(card);
    } else if (status === "READY") {
      stageMap.ready.push(card);
    } else if (status === "OUTREACH" || status === "PITCHED") {
      stageMap.pitched.push(card);
    } else {
      stageMap.outcome.push(card);
    }
  });

  const columns = [
    { id: "ideas", title: "IDEAS", count: stageMap.ideas.length, cards: stageMap.ideas },
    { id: "approved", title: "APPROVED", count: stageMap.approved.length, cards: stageMap.approved },
    { id: "production", title: "IN PRODUCTION", count: stageMap.production.length, cards: stageMap.production },
    { id: "ready", title: "READY", count: stageMap.ready.length, cards: stageMap.ready },
    { id: "pitched", title: "PITCHED", count: stageMap.pitched.length, cards: stageMap.pitched },
    { id: "outcome", title: "OUTCOME", count: stageMap.outcome.length, cards: stageMap.outcome },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
        
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            PR / PIPELINE
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Local PR: Pipeline
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, maxWidth: "1000px", lineHeight: "1.5" }}>
            One trigger-agnostic pipeline: campaigns arrive from the calendar, the intake form, or the reactive monitor, and move left to right.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{
              padding: "7px 14px",
              fontSize: "13px",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              background: "white",
              color: "#334155"
            }}
          >
            <option value="All PR clients">All PR clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/admin/pr/calendar"
              style={{
                background: "#0F4C5C",
                color: "white",
                borderRadius: "6px",
                padding: "7px 16px",
                fontSize: "12.5px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={14} /> Intake Angle
            </Link>
          </div>
        </div>

        {/* Pipeline Board */}
        {loading ? (
          <PageLoader message="Loading PR Pipeline" subtitle="Fetching campaigns from database" showSkeleton />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
            {columns.map((col) => (
              <div
                key={col.id}
                style={{
                  background: "#F1F5F9",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "480px"
                }}
              >
                {/* Column Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "0 4px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#475569", letterSpacing: "0.5px" }}>
                    {col.title}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "700", background: "#E2E8F0", color: "#64748B", padding: "1px 6px", borderRadius: "10px" }}>
                    {col.count}
                  </span>
                </div>

                {/* Cards List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {col.cards.length === 0 ? (
                    <div style={{ border: "1px dashed #CBD5E1", borderRadius: "6px", padding: "20px 10px", textAlign: "center", color: "#94A3B8", fontSize: "11.5px" }}>
                      No campaigns
                    </div>
                  ) : (
                    col.cards.map((card) => (
                      <div
                        key={card.id}
                        style={{
                          background: "white",
                          borderRadius: "6px",
                          border: "1px solid #E2E8F0",
                          padding: "12px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                        }}
                      >
                        <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#0F4C5C", marginBottom: "4px", textTransform: "uppercase" }}>
                          {card.client}
                        </div>
                        <div style={{ fontSize: "12px", color: "#1E293B", lineHeight: "1.4", fontWeight: "500", marginBottom: "10px" }}>
                          {card.angle}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748B" }}>
                          <span>{card.date}</span>
                          <Link href={`/admin/pr/${card.id}`} style={{ color: "#2563EB", textDecoration: "none", fontWeight: "600" }}>
                            View →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
