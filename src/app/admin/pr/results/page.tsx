"use client";

import Link from "next/link";

export default function PrResultsPage() {
  const kpis = [
    { label: "CAMPAIGNS SENT", value: 0 },
    { label: "JOURNALISTS PITCHED", value: 0 },
    { label: "REPLIES", value: 0 },
    { label: "REPLY RATE", value: "0%" },
    { label: "PICKUPS", value: 0 },
    { label: "LINKS (0 FOLLOW)", value: 0 },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / RESULTS
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            PR Results
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
            The review loop: how campaigns performed, by client and trigger, so QBRs can lean into the angles that earn coverage. Counts come from the funnel (pitched contacts &rarr; replies &rarr; published pickups &rarr; links); links flow into the client scorecard automatically.
          </p>
        </div>

        {/* 6 KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px", marginBottom: "28px" }}>
          {kpis.map((k, idx) => (
            <div key={idx} style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "16px 14px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A", lineHeight: "1" }}>
                {k.value}
              </div>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "6px" }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* Campaigns Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>
              Campaigns
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
              Every campaign that entered the pipeline, newest first. Unsent campaigns show their stage; killed ones show why.
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CLIENT</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>ANGLE</th>
                <th style={{ padding: "10px 10px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>TRIGGER</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>SENT</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>STATUS</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>PITCHED</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>REPLIES</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>PICKUPS</th>
                <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>LINKS</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>HIT RATE</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0F172A" }}>
                  SD Plumbing &amp; Heating
                </td>
                <td style={{ padding: "12px 14px", color: "#334155" }}>
                  Edinburgh and Midlothian plumbers reveal the five most common boiler faults they fixed last winter, and which postcodes called most
                </td>
                <td style={{ padding: "12px 10px", color: "#64748B" }}>
                  seasonal
                </td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#94A3B8" }}>
                  &mdash;
                </td>
                <td style={{ padding: "12px 10px", textAlign: "center" }}>
                  <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontSize: "10.5px", fontWeight: "700" }}>
                    READY
                  </span>
                </td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#94A3B8" }}>&mdash;</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#94A3B8" }}>&mdash;</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#94A3B8" }}>&mdash;</td>
                <td style={{ padding: "12px 10px", textAlign: "center", color: "#94A3B8" }}>&mdash;</td>
                <td style={{ padding: "12px 12px", textAlign: "right", color: "#94A3B8" }}>&mdash;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2 Bottom Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
              By client
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 16px 0" }}>
              Where PR is landing for.
            </p>
            <div style={{ color: "#94A3B8", fontSize: "12.5px", textAlign: "center", padding: "24px 0" }}>
              Nothing sent yet.
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
              By trigger type
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 16px 0" }}>
              Which kind of angle earns coverage: seasonal pegs, event/milestone stories, or ad hoc.
            </p>
            <div style={{ color: "#94A3B8", fontSize: "12.5px", textAlign: "center", padding: "24px 0" }}>
              Nothing sent yet.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
