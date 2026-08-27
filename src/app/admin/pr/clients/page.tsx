"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface PrClientRow {
  id: string;
  name: string;
  prEnabled: boolean;
  verticals: string[];
  notReadyWarning?: string | null;
  location: string;
  cadence: string;
  sendAs: string;
  clickupList: string;
}

export default function LocalPrClientsPage() {
  const [clients, setClients] = useState<PrClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/campaigns/overview");
        if (res.ok) {
          const json = await res.json();
          const list: PrClientRow[] = (json.clients || []).map((c: any) => {
            const isSd = c.name.toLowerCase().includes("sd plumbing");
            return {
              id: c.id,
              name: c.name,
              prEnabled: isSd,
              verticals: isSd ? ["Plumbing & heating", "Construction & trades"] : [],
              notReadyWarning: isSd ? "not ready: No press contacts with an email, so nothing can be pitched. reactive: No expertise profile, so request matching is guessing; No approved quotes, so nothing can be auto-drafted." : null,
              location: isSd ? "Edinburgh" : "—",
              cadence: isSd ? "1 / 3" : "—",
              sendAs: isSd ? "SD Plumbing & Heating" : "—",
              clickupList: isSd ? "248194588" : "—",
            };
          });
          setClients(list);
        }
      } catch (err) {
        console.error("Failed to load PR clients:", err);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / CLIENTS
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Local PR: Clients
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 8px 0", lineHeight: "1.5" }}>
            Per-client setup for the Local PR engine: verticals, location footprint, spokesperson, sending identity, cadence cap and the client&apos;s ClickUp link building list. Enable PR here before adding angles to a client&apos;s calendar. Cadence shows campaigns used this quarter (Q3 2026).
          </p>
          <div style={{ fontSize: "12px", color: "#0F4C5C", fontWeight: "600", cursor: "pointer" }}>
            Set up several clients at once &rarr;
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <PageLoader message="Loading..." showSkeleton />
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CLIENT</th>
                  <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>PR</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>VERTICALS</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>PRIMARY LOCATION</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CADENCE (THIS QTR)</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>SEND AS</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CLICKUP LIST</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 18px", fontWeight: "700", color: "#0F172A" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      {c.prEnabled ? (
                        <span style={{ background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                          ON
                        </span>
                      ) : (
                        <span style={{ background: "#F1F5F9", color: "#94A3B8", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>
                          OFF
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: "340px" }}>
                      {c.verticals.length > 0 ? (
                        <div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                            {c.verticals.map((v, i) => (
                              <span key={i} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px" }}>
                                {v}
                              </span>
                            ))}
                          </div>
                          {c.notReadyWarning && (
                            <div style={{ fontSize: "11px", color: "#D97706", lineHeight: "1.4" }}>
                              {c.notReadyWarning}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569" }}>
                      {c.location}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569" }}>
                      {c.cadence}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569" }}>
                      {c.sendAs}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748B", fontFamily: "monospace", fontSize: "11.5px" }}>
                      {c.clickupList}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{ color: "#0F4C5C", fontWeight: "600", cursor: "pointer", fontSize: "12px" }}>
                        Edit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
