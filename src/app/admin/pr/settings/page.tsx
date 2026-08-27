"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Save } from "lucide-react";

export default function LocalPrSettingsPage() {
  const [productionOwner, setProductionOwner] = useState("admin@mistersk.com");
  const [defaultLeadTime, setDefaultLeadTime] = useState(3);
  const [mailboxes, setMailboxes] = useState([
    { id: "mb-1", email: "admin@mistersk.com", label: "Primary PR outreach mailbox", checked: true },
    { id: "mb-2", email: "outreach@mistersk.com", label: "Secondary PR outreach", checked: true },
    { id: "mb-3", email: "press@mistersk.com", label: "General press desk", checked: false },
  ]);
  const [saved, setSaved] = useState(false);

  const handleToggle = (id: string) => {
    setMailboxes(mailboxes.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/pr" style={{ color: "#64748B", textDecoration: "none" }}>PR</Link> / SETTINGS
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Local PR: Settings
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
            Module-wide config. Per-client settings live under Clients.
          </p>
        </div>

        {/* Settings Box */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              Production owner
            </label>
            <input
              type="email"
              value={productionOwner}
              onChange={(e) => setProductionOwner(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              Default lead time (weeks)
            </label>
            <input
              type="number"
              value={defaultLeadTime}
              onChange={(e) => setDefaultLeadTime(Number(e.target.value))}
              style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", outline: "none" }}
            />
            <p style={{ fontSize: "11.5px", color: "#94A3B8", margin: "4px 0 0 0" }}>
              Weeks ahead of a target date to convert a calendar angle into an in-production campaign.
            </p>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "10px" }}>
              PR sending mailboxes
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {mailboxes.map((mb) => (
                <label key={mb.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={mb.checked}
                    onChange={() => handleToggle(mb.id)}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600" }}>{mb.email}</div>
                    <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>{mb.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            style={{
              background: "#0F4C5C",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {saved ? <Check size={14} /> : <Save size={14} />} {saved ? "Saved" : "Save settings"}
          </button>
        </div>

      </div>
    </div>
  );
}
