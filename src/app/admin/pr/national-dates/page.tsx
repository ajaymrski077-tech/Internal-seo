"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface NationalDate {
  id: string;
  name: string;
  nextDate: string;
  rule: string;
  verticals: string;
  peg: string;
  type: string;
}

export default function NationalDateRegistryPage() {
  const [dates, setDates] = useState<NationalDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("Fixed date");
  const [nextDate, setNextDate] = useState("");
  const [rule, setRule] = useState("");
  const [verticals, setVerticals] = useState("");
  const [peg, setPeg] = useState("");

  useEffect(() => {
    fetchDates();
  }, []);

  const fetchDates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pr/national-dates");
      if (res.ok) {
        const data = await res.json();
        setDates(data);
      }
    } catch (err) {
      console.error("Failed to fetch dates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDate = async () => {
    if (!name || !nextDate) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/pr/national-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, nextDate, rule, verticals, peg })
      });
      if (res.ok) {
        setName("");
        setType("Fixed date");
        setNextDate("");
        setRule("");
        setVerticals("");
        setPeg("");
        fetchDates();
      }
    } catch (err) {
      console.error("Failed to create date", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / NATIONAL DATES
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            National-Date Registry
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
            A standard reference of 34 dates, tagged by vertical. Two roles: seeding client angle brainstorms and driving the scheduler&apos;s seasonal dates. It never creates campaigns for client: seeded from QBR/ad + computed = candidate tabs; add your own local/regional dates.
          </p>
        </div>

        {/* Add a Date Form */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: "0 0 14px 0" }}>
            Add a date
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr 2fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Name</label>
              <input type="text" placeholder="e.g. National Transparent Day" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px", background: "white" }}>
                <option>Fixed date</option>
                <option>Computed</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Next date</label>
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} style={{ width: "100%", padding: "5px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Rule</label>
              <input type="text" placeholder="e.g. '3rd Tuesday in September'" value={rule} onChange={(e) => setRule(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Verticals (comma-separated)</label>
              <input type="text" placeholder="e.g. roofing, construction_trades" value={verticals} onChange={(e) => setVerticals(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
            </div>
          </div>
          
          <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>Suggested Peg</label>
              <input type="text" placeholder="e.g. Angle ideas for brainstorms" value={peg} onChange={(e) => setPeg(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #CBD5E1", borderRadius: "4px" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              onClick={handleAddDate}
              disabled={submitting}
              style={{ background: "#0F4C5C", color: "white", border: "none", borderRadius: "4px", padding: "6px 16px", fontSize: "12px", fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Adding..." : "Add date"}
            </button>
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              Refreshed rounded dates (GOV.UK + computed)
            </span>
          </div>
        </div>

        {/* Registry Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0F172A" }}>Registry (34)</span>
          </div>

          {loading ? (
            <PageLoader message="Loading Registry" subtitle="Fetching national dates" showSkeleton />
          ) : dates.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
              No national dates created yet. Add one above.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>NAME</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>NEXT DATE</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>RULE</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>VERTICALS</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>SUGGESTED PEG</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: "700", color: "#0F172A" }}>
                      {d.name}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748B" }}>
                      {d.nextDate}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748B" }}>
                      {d.rule}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#0F766E", fontWeight: "600" }}>
                      {d.verticals}
                    </td>
                    <td style={{ padding: "10px 16px", color: "#475569", lineHeight: "1.4" }}>
                      {d.peg}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px", fontSize: "11px" }}>
                        <span style={{ color: "#64748B", cursor: "pointer" }}>Deactivate</span>
                        <span style={{ color: "#DC2626", cursor: "pointer" }}>Delete</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
