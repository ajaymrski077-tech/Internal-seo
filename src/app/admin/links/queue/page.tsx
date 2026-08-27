"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, Mail, Compass, HelpCircle } from "lucide-react";

interface ActionItem {
  id: string;
  name: string;
  repliesCount?: number;
}

interface ActionQueueData {
  repliesToActions: ActionItem[];
  needsStrategy: ActionItem[];
  needsCampaign: ActionItem[];
  stalled: ActionItem[];
  behindGoal: ActionItem[];
  inMotion: ActionItem[];
  onTrack: ActionItem[];
}

export default function ActionQueuePage() {
  const [data, setData] = useState<ActionQueueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/queue");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load action queue:", err);
      } finally {
        setLoading(false);
      }
    };
    loadQueue();
  }, []);

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
        Action queue data unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building Hub</Link>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Action queue
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
            What needs attention, 2026-08. Grouped by state, not a to-do list: work the top groups, the rest are visibility. Items age and escalate (a campaign with no movement drops into &ldquo;stalled&rdquo;).
          </p>
        </div>

        {/* Group 1: Replies to action */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#2563EB", color: "white", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {data.repliesToActions.length}
            </div>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Replies to action</span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>responses are in, a person is needed</span>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            {data.repliesToActions.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: idx === data.repliesToActions.length - 1 ? "none" : "1px solid #F1F5F9"
                }}
              >
                <div style={{ fontSize: "13px" }}>
                  <strong style={{ color: "#0F172A" }}>{item.name}</strong> &middot; <span style={{ color: "#64748B" }}>{item.repliesCount} new replies waiting</span>
                </div>
                <Link
                  href="/admin/links/replies"
                  style={{
                    background: "#0F4C5C",
                    color: "white",
                    borderRadius: "5px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textDecoration: "none"
                  }}
                >
                  Open inbox
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Group 2: Needs a strategy */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#7C3AED", color: "white", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {data.needsStrategy.length}
            </div>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>Needs a strategy</span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>no plan set this month</span>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            {data.needsStrategy.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: idx === data.needsStrategy.length - 1 ? "none" : "1px solid #F1F5F9"
                }}
              >
                <div style={{ fontSize: "13px" }}>
                  <strong style={{ color: "#0F172A" }}>{item.name}</strong> &middot; <span style={{ color: "#64748B" }}>no plan set this month</span>
                </div>
                <Link
                  href={`/admin/links/${item.id}?plan=true`}
                  style={{
                    background: "#0F4C5C",
                    color: "white",
                    borderRadius: "5px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textDecoration: "none"
                  }}
                >
                  Set plan
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Empty / Inactive Groups */}
        {[
          { count: 0, color: "#EA580C", title: "Needs a campaign", subtitle: "plan set, nothing in motion" },
          { count: 0, color: "#DC2626", title: "Stalled", subtitle: "in motion but not moving, take a look" },
          { count: 0, color: "#D97706", title: "Behind goal", subtitle: "this month is off-track" },
          { count: 0, color: "#64748B", title: "In motion", subtitle: "sent, awaiting, no action needed" },
          { count: 0, color: "#16A34A", title: "On track", subtitle: "nothing needed" },
        ].map((group, idx) => (
          <div key={idx} style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: group.color, color: "white", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {group.count}
              </div>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>{group.title}</span>
              <span style={{ fontSize: "12px", color: "#64748B" }}>{group.subtitle}</span>
            </div>

            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "14px 18px", color: "#94A3B8", fontSize: "12.5px" }}>
              None.
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
