"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Sparkles, Check, ArrowRight } from "lucide-react";
import PageLoader from "@/components/PageLoader";

export default function PrCalendarIntakePage() {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [angle, setAngle] = useState("");
  const [trigger, setTrigger] = useState("Seasonal (dated peg)");
  const [targetDate, setTargetDate] = useState("2026-10-01");
  const [leadTime, setLeadTime] = useState(3);
  const [runWhenReady, setRunWhenReady] = useState(false);
  const [brainstormSeeds, setBrainstormSeeds] = useState<any[]>([]);
  const [loadingSeeds, setLoadingSeeds] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error("Failed to load clients:", err);
      }
    }
    
    async function fetchSeeds() {
      try {
        setLoadingSeeds(true);
        const res = await fetch("/api/pr/national-dates");
        if (res.ok) {
          const data = await res.json();
          setBrainstormSeeds(data);
        }
      } catch (err) {
        console.error("Failed to fetch dates:", err);
      } finally {
        setLoadingSeeds(false);
      }
    }

    fetchClients();
    fetchSeeds();
  }, []);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1500px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / CALENDAR &amp; INTAKE
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            PR Calendar &amp; Intake
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, maxWidth: "1000px", lineHeight: "1.5" }}>
            Bespoke angles per client, added here from QBR brainstorms or ad hoc. Approving a dated angle creates a pipeline campaign (cadence-capped, Q3 2026); run-when-ready angles park until activated. The national dates on the right seed the brainstorm and never auto-create anything.
          </p>
        </div>

        {/* 2-Column Grid: Form & Brainstorm Seeds */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "24px" }}>
          
          {/* Left Column: Form, AI Ideas & Entries Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Add an Angle Form */}
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                Add an angle
              </h3>
              <p style={{ fontSize: "11.5px", color: "#64748B", margin: "0 0 16px 0" }}>
                Client + angle + when. &ldquo;When&rdquo; is a date, or tick run-when-ready to park it (QBR sweep parked items)
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white" }}
                  >
                    <option value="">Select a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Angle</label>
                  <input
                    type="text"
                    placeholder="e.g. 'Boiler switch-on day: the exact date [town] turns its heating on'"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", fontSize: "12.5px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr", gap: "12px", marginBottom: "16px", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Trigger</label>
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white" }}
                  >
                    <option>Seasonal (dated peg)</option>
                    <option>Ad hoc</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Target date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ width: "100%", padding: "5px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Lead time (weeks)</label>
                  <input
                    type="number"
                    value={leadTime}
                    onChange={(e) => setLeadTime(Number(e.target.value))}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white" }}
                  >
                    <option>Manual</option>
                    <option>AI Brainstorm</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={runWhenReady}
                    onChange={(e) => setRunWhenReady(e.target.checked)}
                  />
                  <span>Run when ready (park)</span>
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
                  Add to calendar
                </button>
              </div>

              <div style={{ marginTop: "12px", fontSize: "11.5px", color: "#0F4C5C", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                &bull; Drop angles over from a chat brainstorm (paste)
              </div>
            </div>

            {/* Angle Ideas (AI) Card */}
            <div style={{ background: "#FFFBEB", borderRadius: "8px", border: "1px solid #FDE68A", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Sparkles size={14} color="#D97706" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#92400E" }}>Angle Ideas (AI)</span>
              </div>
              <p style={{ fontSize: "11.5px", color: "#92400E", margin: "0 0 10px 0" }}>
                Brainstorm 3 client-specific angles from their profile and the matched national dates, avoiding anything already planned. Pick the good ones; each Add creates a normal draft entry for the human gates to judge.
              </p>
              <div style={{ fontSize: "12px", color: "#B45309", fontStyle: "italic" }}>
                Select a client in the form above to generate ideas for them.
              </div>
            </div>

            {/* Angle Entries Table */}
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>Angle entries</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>CLIENT</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>ANGLE</th>
                    <th style={{ padding: "10px 10px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>TRIGGER</th>
                    <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>DATE</th>
                    <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>STATUS</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0F172A" }}>
                      SD Plumbing &amp; Heating
                    </td>
                    <td style={{ padding: "12px 14px", color: "#334155" }}>
                      Edinburgh and Midlothian plumbers reveal the five most common boiler faults they fixed last winter, and which postcodes called most
                    </td>
                    <td style={{ padding: "12px 10px", color: "#64748B" }}>
                      seasonal
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center", color: "#64748B" }}>
                      2025-10-01
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "10px", fontSize: "10.5px", fontWeight: "700" }}>
                        CONVERTED
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <span style={{ color: "#0F4C5C", cursor: "pointer", fontWeight: "600" }}>Edit</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Column: Brainstorm Seeds Registry */}
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>National dates (Next 90 Days)</h3>
                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>Computed dates to seed brainstorms.</p>
              </div>

              {loadingSeeds ? (
                <PageLoader message="Loading seeds" showSkeleton />
              ) : brainstormSeeds.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748B", fontSize: "12px" }}>
                  No national dates found. Add some in the National-Date Registry.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {brainstormSeeds.map((seed: any) => (
                    <div key={seed.id} style={{ padding: "12px", borderRadius: "6px", background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#0F172A" }}>{seed.name}</span>
                        <span style={{ fontSize: "11px", color: "#0F766E", fontWeight: "600" }}>{seed.nextDate}</span>
                      </div>
                      <p style={{ fontSize: "11.5px", color: "#475569", margin: "0 0 10px 0", lineHeight: "1.4" }}>
                        {seed.peg || seed.rule || "No suggested peg."}
                      </p>
                      <button style={{ width: "100%", background: "white", border: "1px solid #CBD5E1", borderRadius: "4px", padding: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer", color: "#0F172A" }}>
                        Use this date
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

        </div>

      </div>
    </div>
  );
}
