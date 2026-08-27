"use client";

import { use, useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, ArrowUpRight, Plus, ExternalLink } from "lucide-react";

interface ClientWorkspaceData {
  client: {
    id: string;
    name: string;
    domain: string;
    monthlyTarget: number;
    geography: string;
    competitorsCount: number;
  };
  stats: {
    prospectsQualified: number;
    targetProspects: number;
    emailsSent: number;
    linksSecured: number;
    trackedLinksTotal: number;
    openCampaigns: number;
    recentLinks: any[];
  };
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    prospectsCount: number;
    acquiredCount: number;
  }>;
}

export default function ClientLinkWorkspacePage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<ClientWorkspaceData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHub = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/links/${resolvedParams.clientId}/hub`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load client link hub:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHub();
  }, [resolvedParams.clientId]);

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
        Client link workspace unavailable.
      </div>
    );
  }

  const tabs = [
    { name: "Overview" },
    { name: "Campaigns", preview: true },
    { name: "Prospect Queue", preview: true },
    { name: "Tracked Links", preview: true },
    { name: "Competitors", preview: true },
    { name: "Content", preview: true },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: "8px", fontSize: "13px", color: "#64748B" }}>
          <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>
            &larr; Links Dashboard
          </Link>{" "}
          / <span style={{ color: "#0F172A", fontWeight: "600" }}>{data.client.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              {data.client.name}
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              {data.client.monthlyTarget} prospects/month target
            </p>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link
              href="/admin/links/analysis"
              style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
            >
              Link Analysis <ArrowUpRight size={13} />
            </Link>
            <Link
              href={`/admin/rankings/${data.client.id}`}
              style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
            >
              Rankings <ArrowUpRight size={13} />
            </Link>
            <Link
              href={`/admin/onpage/audits/${data.client.id}`}
              style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}
            >
              On-Page <ArrowUpRight size={13} />
            </Link>
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
                cursor: "pointer"
              }}
            >
              This month's plan &check;
            </button>
          </div>
        </div>

        {/* Workspace Tabs */}
        <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px", fontSize: "13.5px" }}>
          {tabs.map((t) => (
            <div
              key={t.name}
              onClick={() => setActiveTab(t.name)}
              style={{
                paddingBottom: "10px",
                borderBottom: activeTab === t.name ? "2px solid #0F4C5C" : "none",
                color: activeTab === t.name ? "#0F172A" : "#64748B",
                fontWeight: activeTab === t.name ? "700" : "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {t.name}
              {t.preview && (
                <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: "10px", fontWeight: "700", padding: "1px 5px", borderRadius: "4px" }}>
                  PREVIEW
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Progress Box */}
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
              This month's plan progress
            </span>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              {data.stats.linksSecured} of 0 links built &middot; 2026-08
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12.5px", color: "#64748B" }}>
              No targets set for this month. <span style={{ color: "#0F4C5C", fontWeight: "600", cursor: "pointer" }}>Set the plan &rarr;</span>
            </span>
            <span style={{ fontSize: "12px", color: "#0F4C5C", fontWeight: "600", cursor: "pointer" }}>
              Edit this month's plan &rarr;
            </span>
          </div>
        </div>

        {/* 3 Grid Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: "20px" }}>
          
          {/* Card 1: Client Settings */}
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 20px 0" }}>
              Client Settings
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", rowGap: "14px", fontSize: "12.5px" }}>
              <span style={{ color: "#94A3B8" }}>Domain</span>
              <span style={{ color: "#1E293B", fontWeight: "500" }}>{data.client.domain}</span>

              <span style={{ color: "#94A3B8" }}>Competitors</span>
              <span style={{ color: "#1E293B" }}>None configured</span>

              <span style={{ color: "#94A3B8" }}>Geography</span>
              <span style={{ color: "#1E293B" }}>{data.client.geography || "&mdash;"}</span>

              <span style={{ color: "#94A3B8" }}>Monthly target</span>
              <span style={{ color: "#1E293B", fontWeight: "600" }}>{data.client.monthlyTarget} prospects</span>
            </div>
          </div>

          {/* Card 2: Current Month Stats */}
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                August 2026
              </h3>
              <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>This month</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A" }}>
                  {data.stats.prospectsQualified}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>
                  Prospects qualified <br /><span style={{ fontSize: "11px", color: "#94A3B8" }}>of {data.stats.targetProspects} target (0%)</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A" }}>
                  {data.stats.emailsSent}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>Emails sent</div>
              </div>

              <div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A" }}>
                  {data.stats.linksSecured}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>Links secured</div>
              </div>

              <div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A" }}>
                  {data.stats.trackedLinksTotal}
                </div>
                <div style={{ fontSize: "12px", color: "#64748B" }}>Tracked links total</div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>
                {data.stats.openCampaigns}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "12px" }}>Open campaigns</div>

              <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginBottom: "4px" }}>
                RECENT LINKS SECURED
              </div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>
                No links logged yet.
              </div>
            </div>
          </div>

          {/* Card 3: Alerts */}
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
              Alerts
            </h3>
            <div style={{ color: "#64748B", fontSize: "12.5px" }}>
              No alerts. All caught up.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
