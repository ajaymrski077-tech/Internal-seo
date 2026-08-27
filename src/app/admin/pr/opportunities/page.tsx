"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Search, Sparkles } from "lucide-react";

export default function AssetOpportunitiesPage() {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [domainsToMine, setDomainsToMine] = useState("");
  const [mining, setMining] = useState(false);

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
    fetchClients();
  }, []);

  const handleMine = () => {
    setMining(true);
    setTimeout(() => setMining(false), 1500);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / ASSET OPPORTUNITIES
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Asset Opportunities
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
            Rather than guessing what might earn links, look at what already does. This reads the most-linked pages across a client&apos;s competitors, finds the repeatable formats behind them, and proposes the client&apos;s own version. Every proposal carries the real pages it was derived from, so you can check the reasoning. Accepted ones go into the content pipeline as a normal idea.
          </p>
        </div>

        {/* Mining Form */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
            Mine a client&apos;s space
          </h3>
          <p style={{ fontSize: "12px", color: "#64748B", margin: "0 0 20px 0" }}>
            Uses the client&apos;s competitors on file by default. Add other domains to look at (sector publishers, adjacent brands) one per line or comma separated. Only pages with 25+ referring domains count as evidence, and homepages and section hubs are ignored because sitewide links make them meaningless.
          </p>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", background: "white" }}
            >
              <option value="">Pick a client</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              Domains to mine <span style={{ color: "#94A3B8", fontWeight: "400" }}>(blank = the competitors on file, and there are none yet)</span>
            </label>
            <textarea
              rows={4}
              value={domainsToMine}
              onChange={(e) => setDomainsToMine(e.target.value)}
              placeholder="e.g. industryleader.com, tradejournal.org"
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <button
              type="button"
              style={{
                background: "#F1F5F9",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "6px"
              }}
            >
              Find competitors automatically (Ahrefs)
            </button>
            <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>
              Keyword overlap finds competitors. Sector publishers and trade titles rarely share keywords with a client, so add those by hand: they are often where the best-linked pages are.
            </div>
          </div>

          <button
            type="button"
            onClick={handleMine}
            disabled={mining || !selectedClient}
            style={{
              background: "#0F4C5C",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "9px 20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: (!selectedClient || mining) ? "not-allowed" : "pointer",
              opacity: (!selectedClient || mining) ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {mining ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />} {mining ? "Mining space..." : "Mine opportunities"}
          </button>
        </div>

      </div>
    </div>
  );
}
