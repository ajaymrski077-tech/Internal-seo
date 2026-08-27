"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, RotateCcw, Check } from "lucide-react";

export default function LinkBuildingSettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const [saved, setSaved] = useState(false);

  const [blacklistDomains, setBlacklistDomains] = useState("");
  const [blacklistTlds, setBlacklistTlds] = useState("");
  const [minDr, setMinDr] = useState<number | "">("");
  const [minTraffic, setMinTraffic] = useState<number | "">("");
  const [maxObl, setMaxObl] = useState<number | "">("");

  const [checkAdult, setCheckAdult] = useState(true);
  const [checkLinkFarms, setCheckLinkFarms] = useState(true);
  const [checkIndexed, setCheckIndexed] = useState(true);
  const [flagPreviousLinks, setFlagPreviousLinks] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const navItems = [
    "General",
    "Project & Flow",
    "Quality Thresholds",
    "API Keys",
    "Notifications",
    "Staffing & Sourcing",
    "Archived Campaigns"
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
              <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building</Link>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Link Building Settings
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Configure system-wide settings for prospecting, verification and outreach
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Reset Changes
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                background: "#0F4C5C",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "7px 16px",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {saved ? <Check size={14} /> : <Save size={14} />} {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px" }}>
          
          {/* Side Menu */}
          <div>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              {navItems.map((item) => (
                <div
                  key={item}
                  onClick={() => setActiveTab(item)}
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: activeTab === item ? "700" : "500",
                    color: activeTab === item ? "#0F4C5C" : "#64748B",
                    background: activeTab === item ? "#F0FDFA" : "transparent",
                    borderLeft: activeTab === item ? "3px solid #0F4C5C" : "3px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Pane Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Blacklist Section */}
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                Blacklist
              </h3>
              
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Blacklisted Domains
                </label>
                <textarea
                  rows={2}
                  value={blacklistDomains}
                  onChange={(e) => setBlacklistDomains(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Blacklisted TLDs
                </label>
                <input
                  type="text"
                  value={blacklistTlds}
                  onChange={(e) => setBlacklistTlds(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", outline: "none" }}
                />
              </div>
            </div>

            {/* Import Filters */}
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                Import Filters
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>
                    Min DR
                  </label>
                  <input
                    type="number"
                    value={minDr}
                    onChange={(e) => setMinDr(Number(e.target.value))}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>
                    Min Monthly Traffic
                  </label>
                  <input
                    type="number"
                    value={minTraffic}
                    onChange={(e) => setMinTraffic(Number(e.target.value))}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748B", marginBottom: "4px" }}>
                    Max Outbound Links (OBL)
                  </label>
                  <input
                    type="number"
                    value={maxObl}
                    onChange={(e) => setMaxObl(Number(e.target.value))}
                    style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>
              </div>
            </div>

            {/* Quality Thresholds */}
            <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                Quality Thresholds
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={checkAdult} onChange={(e) => setCheckAdult(e.target.checked)} />
                  <span>Check for adult / gambling keywords on target domains</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={checkLinkFarms} onChange={(e) => setCheckLinkFarms(e.target.checked)} />
                  <span>Check for link farm footprint patterns</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={checkIndexed} onChange={(e) => setCheckIndexed(e.target.checked)} />
                  <span>Verify domain is indexed on Google before qualifying</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                  <input type="checkbox" checked={flagPreviousLinks} onChange={(e) => setFlagPreviousLinks(e.target.checked)} />
                  <span>Flag if client has previously received a link from this domain</span>
                </label>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
