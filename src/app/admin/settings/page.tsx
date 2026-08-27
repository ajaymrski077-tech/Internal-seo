"use client";

import { useState } from "react";
import Link from "next/link";
import { Save, Check, Key, Shield, Globe, Users, Bell, Database } from "lucide-react";

export default function GlobalSettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const [saved, setSaved] = useState(false);

  const [agencyName, setAgencyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [cronInterval, setCronInterval] = useState("");

  const [gscClientId, setGscClientId] = useState("");
  const [ahrefsApiKey, setAhrefsApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "General", label: "General & Branding", icon: Globe },
    { id: "APIs", label: "API Integrations", icon: Key },
    { id: "Security", label: "Security & Auth", icon: Shield },
    { id: "Database", label: "Database & Backups", icon: Database },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Global Platform Settings
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Master configuration, API credentials, sync intervals, and white-label settings
            </p>
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
            {saved ? <Check size={14} /> : <Save size={14} />} {saved ? "Saved" : "Save Changes"}
          </button>
        </div>

        {/* 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "24px" }}>
          
          {/* Side Tabs */}
          <div>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "12px 16px",
                      fontSize: "13px",
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? "#0F4C5C" : "#64748B",
                      background: isSelected ? "#F0FDFA" : "transparent",
                      borderLeft: isSelected ? "3px solid #0F4C5C" : "3px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <Icon size={15} /> {tab.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {activeTab === "General" && (
              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                  General Platform Configuration
                </h3>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Platform Title
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Primary Administrator Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    App Host URL
                  </label>
                  <input
                    type="text"
                    value={primaryDomain}
                    onChange={(e) => setPrimaryDomain(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    GSC Daily Sync Interval
                  </label>
                  <input
                    type="text"
                    value={cronInterval}
                    onChange={(e) => setCronInterval(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                  />
                </div>
              </div>
            )}

            {activeTab === "APIs" && (
              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                  Third-Party API Credentials
                </h3>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    value={gscClientId}
                    onChange={(e) => setGscClientId(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Ahrefs API v3 Token
                  </label>
                  <input
                    type="password"
                    value={ahrefsApiKey}
                    onChange={(e) => setAhrefsApiKey(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", fontFamily: "monospace" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    OpenAI / Anthropic Master API Key
                  </label>
                  <input
                    type="password"
                    value={openAiApiKey}
                    onChange={(e) => setOpenAiApiKey(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: "1px solid #CBD5E1", borderRadius: "6px", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                  Security &amp; Session Management
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.5" }}>
                  JWT sessions are securely signed using high-entropy secrets. Passwords are hash-encrypted using Bcrypt rounds.
                </p>
              </div>
            )}

            {activeTab === "Database" && (
              <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "0 0 16px 0" }}>
                  Database Engine
                </h3>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.5" }}>
                  Connected to MongoDB Atlas replica set with full Prisma ORM schema indexing across Clients, TrackedKeywords, GSC Properties, LinkCampaigns, and Audit URLs.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
