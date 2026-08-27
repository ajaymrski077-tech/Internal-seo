"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";

interface VaQueueItem {
  id: string;
  domain: string;
  dr: number;
  traffic: number;
  rd: number;
  campaign: string;
  contactUrl: string;
  email: string;
  name: string;
}

interface VaQueueData {
  summary: {
    totalWaiting: number;
    showing: number;
    completedToday: number;
  };
  clients: Array<{ id: string; name: string }>;
  queueItems: VaQueueItem[];
}

export default function VaContactQueuePage() {
  const [data, setData] = useState<VaQueueData | null>(null);
  const [items, setItems] = useState<VaQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQueue = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/va-queue");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setItems(json.queueItems || []);
        }
      } catch (err) {
        console.error("Failed to load VA queue:", err);
      } finally {
        setLoading(false);
      }
    };
    loadQueue();
  }, []);

  const handleUpdate = (id: string, field: "email" | "name", val: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleSave = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSkip = (id: string) => {
    setItems(items.filter(item => item.id !== id));
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
        VA Queue unavailable.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/links/campaigns" style={{ color: "#64748B", textDecoration: "none" }}>Campaigns</Link> &gt; VA Contact Queue
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            VA Contact Queue
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
            Find contact details for prospects where automated lookup failed
          </p>
        </div>

        {/* 3 KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {data.summary.totalWaiting}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Total Waiting
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
              {items.length}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Showing
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669", lineHeight: "1" }}>
              {data.summary.completedToday}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              Completed Today
            </div>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "4px" }}>CLIENT</div>
            <select style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}>
              <option>All Clients</option>
              {data.clients.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "4px" }}>CAMPAIGN</div>
            <select style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", color: "#334155" }}>
              <option>All Campaigns</option>
            </select>
          </div>
        </div>

        {/* Yellow Instruction Box */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "20px",
            color: "#92400E",
            fontSize: "12.5px",
            lineHeight: "1.5"
          }}
        >
          &bull; Find the editor, content manager, or site owner email for each domain. Check the Contact/About page first, then try LinkedIn or Hunter.io. Aim for a named contact rather than info@.
        </div>

        {/* Queue Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>
            Queue ({items.length} prospects)
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>DOMAIN</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>DR</th>
                <th style={{ padding: "10px 10px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>TRAFFIC</th>
                <th style={{ padding: "10px 10px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>RD</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CAMPAIGN</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>CONTACT PAGE</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>EMAIL</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CONTACT NAME</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr key={q.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "10px 16px", fontWeight: "600", color: "#0F172A" }}>
                    {q.domain}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "center", fontWeight: "700", color: "#0F4C5C" }}>
                    {q.dr}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", color: "#64748B" }}>
                    {q.traffic.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "right", color: "#64748B" }}>
                    {q.rd}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#64748B", fontSize: "11.5px" }}>
                    {q.campaign}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <a
                      href={q.contactUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#F1F5F9",
                        color: "#0F172A",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px"
                      }}
                    >
                      Contact <ExternalLink size={10} />
                    </a>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="email"
                      value={q.email}
                      onChange={(e) => handleUpdate(q.id, "email", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "4px 8px",
                        fontSize: "12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px"
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      type="text"
                      placeholder="First Last"
                      value={q.name}
                      onChange={(e) => handleUpdate(q.id, "name", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "4px 8px",
                        fontSize: "12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px"
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleSave(q.id)}
                        style={{
                          background: "#059669",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Save
                      </button>
                      <span
                        onClick={() => handleSkip(q.id)}
                        style={{ color: "#DC2626", fontSize: "11.5px", cursor: "pointer" }}
                      >
                        Skip
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Progress */}
        <div style={{ fontSize: "12px", color: "#94A3B8" }}>
          Session progress: 0%
        </div>

      </div>
    </div>
  );
}
