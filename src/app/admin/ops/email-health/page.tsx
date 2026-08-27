"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

export default function EmailHealthPage() {
  const [mailboxes, setMailboxes] = useState([]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/ops" style={{ color: "#64748B", textDecoration: "none" }}>Ops</Link> / EMAIL HEALTH
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Outreach Mailbox Health &amp; Deliverability
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
            SPF, DKIM, DMARC records, warm-up status, daily volume limits, and bounce metrics
          </p>
        </div>

        {/* Mailbox Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "12px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>MAILBOX</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>PROVIDER</th>
                <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>SPF</th>
                <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>DKIM</th>
                <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>DMARC</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>SENT (TODAY)</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>BOUNCE RATE</th>
                <th style={{ padding: "12px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>WARM-UP</th>
              </tr>
            </thead>
            <tbody>
              {mailboxes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No mailboxes configured.
                  </td>
                </tr>
              ) : mailboxes.map((box: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 20px", fontWeight: "600", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Mail size={14} color="#64748B" />
                    {box.email}
                    <span style={{ fontSize: "10px", color: "#64748B", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                      {box.provider}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <span style={{ background: box.spf === "Pass" ? "#D1FAE5" : "#FEE2E2", color: box.spf === "Pass" ? "#065F46" : "#991B1B", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>SPF</span>
                      <span style={{ background: box.dkim === "Pass" ? "#D1FAE5" : "#FEE2E2", color: box.dkim === "Pass" ? "#065F46" : "#991B1B", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>DKIM</span>
                      <span style={{ background: box.dmarc === "Pass" ? "#D1FAE5" : "#FEE2E2", color: box.dmarc === "Pass" ? "#065F46" : "#991B1B", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>DMARC</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "center", fontWeight: "600", color: "#0F172A" }}>
                    {box.dailySent} <span style={{ color: "#94A3B8", fontSize: "11px", fontWeight: "400" }}>/ {box.dailyLimit}</span>
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "center", color: "#0F766E", fontWeight: "600" }}>
                    {box.bounceRate}
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "center", color: "#059669", fontWeight: "600", fontSize: "11px" }}>
                    {box.warmStatus}
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "right" }}>
                    <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", cursor: "pointer" }}>
                      Manage
                    </button>
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
