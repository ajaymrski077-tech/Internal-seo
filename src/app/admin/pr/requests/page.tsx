"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Plus, AlertTriangle, Check, Search } from "lucide-react";

export default function JournalistRequestsPage() {
  const [mailbox, setMailbox] = useState("admin@mistersk.com");
  const [lookBack, setLookBack] = useState("3 days");
  const [requestText, setRequestText] = useState("");
  const [source, setSource] = useState("JournoFinder");
  const [scanning, setScanning] = useState(false);

  const [sourcesList, setSourcesList] = useState([]);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 1200);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / JOURNALIST REQUESTS
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
                Journalist Requests
              </h1>
              <p style={{ color: "#64748B", fontSize: "13px", margin: 0, maxWidth: "900px", lineHeight: "1.5" }}>
                Reactive PR: a reporter wants comment today and the first usable reply wins. The queue is sorted by how long is left, not when it arrived. Nothing sends by itself: match, draft from pre-approved quotes, then accept to turn it into a normal campaign.
              </p>
            </div>
            <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}>
              Show all, including closed
            </button>
          </div>
        </div>

        {/* Yellow Warning */}
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "24px",
            color: "#92400E",
            fontSize: "12.5px",
            lineHeight: "1.5"
          }}
        >
          <strong>Not ready to answer fast:</strong> SD Plumbing &amp; Heating has no pre-approved quotes on file. Reactive PR is lost waiting for quote approval, not waiting for a draft. Add standing quotes on each client&apos;s PR settings page.
        </div>

        {/* Pull in Alert Emails Box */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
            Pull in the alert emails
          </h3>
          <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 16px 0", lineHeight: "1.5" }}>
            Nearly every journalist request platform delivers by email and most have no API worth having, so the intake is one mailbox rather than six integrations. Forward the alerts to a connected mailbox and this reads them: digests are split into individual requests, each one is matched against every client, and anything scoring 70+ arrives with a response already drafted. Re-scanning is safe, nothing is queued twice.
          </p>

          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Mailbox</label>
              <select
                value={mailbox}
                onChange={(e) => setMailbox(e.target.value)}
                style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", width: "240px" }}
              >
                <option value="admin@mistersk.com">admin@mistersk.com</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Look back</label>
              <select
                value={lookBack}
                onChange={(e) => setLookBack(e.target.value)}
                style={{ padding: "6px 12px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white", width: "160px" }}
              >
                <option value="3 days">3 days</option>
                <option value="7 days">7 days</option>
                <option value="14 days">14 days</option>
              </select>
            </div>

            <button
              onClick={handleScan}
              disabled={scanning}
              style={{
                background: "#0F4C5C",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "7px 16px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {scanning ? "Scanning..." : "Scan for requests"}
            </button>
          </div>
        </div>

        {/* Where requests come from Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>
              Where requests come from
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
              HARO is the name everyone still uses, but Cision shut it down in December 2024. Start with the free ones: they cost nothing to test and prove whether the workflow earns its keep before anyone pays for ResponseSource.
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>SOURCE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>COST</th>
                <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>UK COVERAGE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>DELIVERY</th>
                <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>NOTES</th>
              </tr>
            </thead>
            <tbody>
              {sourcesList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No sources added yet.
                  </td>
                </tr>
              ) : sourcesList.map((src: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0F172A" }}>{src.name}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{src.cost}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{src.coverage}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{src.delivery}</td>
                  <td style={{ padding: "12px 16px", color: "#475569", lineHeight: "1.4" }}>{src.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add a request Form */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
            Add a request
          </h3>
          <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 14px 0" }}>
            Paste what the journalist posted. Leave the fields blank and the details are read out of the text.
          </p>

          <textarea
            rows={3}
            placeholder="Looking for a data centre expert to comment on grid connection delays. Need a quote by 4pm today. Please include name, job title and company."
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            style={{ width: "100%", padding: "10px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", marginBottom: "14px", outline: "none" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Source</label>
              <select style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }}>
                <option>journofinder</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Outlet</label>
              <input type="text" placeholder="read from the text if blank" style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Journalist</label>
              <input type="text" placeholder="optional" style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Reply-to email</label>
              <input type="text" placeholder="optional" style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Deadline</label>
              <input type="text" placeholder="2026-08-27 16:00" style={{ width: "100%", padding: "6px 8px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155" }}>
              <input type="checkbox" defaultChecked />
              <span>Read the outlet, deadline and ask out of the text</span>
            </label>

            <button
              type="button"
              style={{
                background: "#0F4C5C",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "7px 16px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Add and match
            </button>
          </div>
        </div>

        {/* Open Queue (0) */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 10px 0" }}>
            Open queue (0)
          </h3>
          <div style={{ color: "#94A3B8", fontSize: "12.5px" }}>
            Nothing in the queue
          </div>
        </div>

        {/* Reactive readiness */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 2px 0" }}>
              Reactive readiness
            </h3>
            <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
              Whether each client can actually answer inside an hour. Expertise tells the matcher what they can speak to; approved quotes are what removes the wait.
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "8px 0", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CLIENT</th>
                <th style={{ padding: "8px 0", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>EXPERTISE PROFILE</th>
                <th style={{ padding: "8px 0", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>APPROVED QUOTES</th>
                <th style={{ padding: "8px 0", textAlign: "right", fontWeight: "600", fontSize: "11px" }}></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "12px 0", fontWeight: "700", color: "#0F172A" }}>
                  SD Plumbing &amp; Heating
                </td>
                <td style={{ padding: "12px 0", color: "#D97706" }}>
                  not set
                </td>
                <td style={{ padding: "12px 0", color: "#D97706" }}>
                  none
                </td>
                <td style={{ padding: "12px 0", textAlign: "right" }}>
                  <button style={{ background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "4px 10px", fontSize: "11.5px", cursor: "pointer" }}>
                    Set up
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
