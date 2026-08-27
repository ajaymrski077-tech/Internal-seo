"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight, BarChart2 } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ClientPlanCard {
  id: string;
  code: string;
  name: string;
  hasPlan: boolean;
  monthlyTarget: number | null;
  emails: number;
  queue: number;
  awaiting: number;
  ready: number;
  campaignsCount: number;
}

interface LinksHubData {
  summary: {
    totalBuilt: number;
    totalPlanned: number;
    editorial: { built: number; planned: number | null };
    directory: { built: number; planned: number | null };
  };
  velocityChart: Array<{ month: string; count: number }>;
  clientPlans: ClientPlanCard[];
  otherClientsCount: number;
  recentActivity: Array<{ id: string; text: string }>;
}

export default function LinkBuildingOverviewPage() {
  const [data, setData] = useState<LinksHubData | null>(null);
  const [timeRange, setTimeRange] = useState<"this_month" | "last_month" | "3_months">("this_month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/links/overview?range=${timeRange}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load link building overview:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [timeRange]);

  if (loading) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
        <PageLoader message="Loading Links Overview" subtitle="Aggregating backlink data" showSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
        Link building data unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header & Filter Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Link Building
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              What we planned and built, across all clients
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "inline-flex", background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setTimeRange("this_month")}
                style={{
                  background: timeRange === "this_month" ? "#0F4C5C" : "white",
                  color: timeRange === "this_month" ? "white" : "#64748B",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                This month
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("last_month")}
                style={{
                  background: timeRange === "last_month" ? "#0F4C5C" : "white",
                  color: timeRange === "last_month" ? "white" : "#64748B",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "12.5px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Last month
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("3_months")}
                style={{
                  background: timeRange === "3_months" ? "#0F4C5C" : "white",
                  color: timeRange === "3_months" ? "white" : "#64748B",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "12.5px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Last 3 months
              </button>
            </div>

            <button
              type="button"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Show archived
            </button>

            <Link
              href="/admin/links/analysis"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: "500",
                textDecoration: "none",
              }}
            >
              Link Analysis
            </Link>

            <Link
              href="/admin/links/prospects"
              style={{
                background: "#0F4C5C",
                color: "white",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Plus size={14} /> + New Brief
            </Link>
          </div>
        </div>

        {/* Links by Type Section */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
              Links by type &middot; <span style={{ fontWeight: "400", color: "#64748B" }}>This month</span>
            </span>
            <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>
              {data.summary.totalBuilt} built of {data.summary.totalPlanned} planned
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>
                Editorial / guest post
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A" }}>
                {data.summary.editorial.built} <span style={{ fontSize: "14px", color: "#94A3B8", fontWeight: "400" }}>/ &mdash; planned</span>
              </div>
              <div style={{ width: "100%", height: "4px", background: "#0F4C5C", borderRadius: "2px", marginTop: "12px" }} />
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", marginBottom: "4px" }}>
                Directory
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A" }}>
                {data.summary.directory.built} <span style={{ fontSize: "14px", color: "#94A3B8", fontWeight: "400" }}>/ &mdash; planned</span>
              </div>
              <div style={{ width: "100%", height: "4px", background: "#0F4C5C", borderRadius: "2px", marginTop: "12px" }} />
            </div>
          </div>
        </div>

        {/* Link Velocity Chart */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>Link Velocity</span>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>Links secured per month (outreach)</span>
          </div>

          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.velocityChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "6px", border: "none", background: "#0F172A", color: "white" }} itemStyle={{ color: "white" }} />
                <Bar dataKey="count" fill="#5F8D8F" radius={[4, 4, 0, 0]} maxBarSize={120} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Column: Client Plans & Recent Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          
          {/* Client Plans */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "14px" }}>
              Client plans
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {data.clientPlans.map((plan) => (
                <div
                  key={plan.id}
                  style={{
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "150px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8" }}>{plan.code}</span>
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>{plan.name}</span>
                      </div>
                      <span style={{ background: "#F1F5F9", color: "#64748B", fontSize: "10.5px", fontWeight: "600", padding: "1px 6px", borderRadius: "10px" }}>
                        No plan
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>No plan set this month</span>
                      <Link
                        href={`/admin/links/${plan.id}?plan=true`}
                        style={{
                          background: "#0F4C5C",
                          color: "white",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          textDecoration: "none"
                        }}
                      >
                        Set up plan &rarr;
                      </Link>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "#94A3B8", marginBottom: "12px" }}>
                      <span>Emails {plan.emails}</span>
                      <span>&middot; Queue {plan.queue}</span>
                      <span>&middot; Awaiting {plan.awaiting}</span>
                      <span>&middot; Ready {plan.ready}</span>
                      <span>&middot; Campaigns {plan.campaignsCount}</span>
                    </div>

                    <Link
                      href={`/admin/links/${plan.id}`}
                      style={{
                        background: "#F8FAFC",
                        color: "#334155",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        padding: "4px 12px",
                        fontSize: "11.5px",
                        fontWeight: "500",
                        textDecoration: "none",
                        display: "inline-block"
                      }}
                    >
                      View hub
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {data.otherClientsCount > 0 && (
              <div style={{ marginTop: "16px", fontSize: "12.5px", color: "#64748B", cursor: "pointer" }}>
                Other clients without a plan ({data.otherClientsCount}) &blacktriangledown;
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px", minHeight: "240px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                Recent Activity
              </h3>
              <div style={{ color: "#94A3B8", fontSize: "12.5px", textAlign: "center", paddingTop: "40px" }}>
                No activity yet
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
