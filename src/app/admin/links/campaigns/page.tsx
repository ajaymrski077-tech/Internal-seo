"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";
interface CampaignClientItem {
  id: string;
  name: string;
  domain: string;
  hasCampaigns: boolean;
  activeCount: number;
  campaignsCount: number;
  repliesCount: number;
  linksCount: number;
  sentTotal: number;
  sent30d: number;
  replyRate: string;
  unreadReplies: number;
}

export default function CampaignsDirectoryPage() {
  const [clients, setClients] = useState<CampaignClientItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/campaigns/overview");
        if (res.ok) {
          const json = await res.json();
          setClients(json.clients || []);
        }
      } catch (err) {
        console.error("Failed to load campaigns directory:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
            <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building</Link>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Campaigns
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
            Select a client to manage their outreach campaigns
          </p>
        </div>

        {/* 3-Column Client Cards Grid */}
        {loading ? (
          <PageLoader message="Loading Campaigns" subtitle="Fetching campaign data" showSkeleton />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/admin/links/${c.id}`}
                style={{
                  background: "white",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "220px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  textDecoration: "none"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: 0 }}>
                      {c.name}
                    </h3>
                    {c.hasCampaigns ? (
                      <span style={{ background: "#D1FAE5", color: "#065F46", fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px" }}>
                        {c.activeCount} active
                      </span>
                    ) : (
                      <span style={{ background: "#F1F5F9", color: "#94A3B8", fontSize: "11px", fontWeight: "500", padding: "2px 8px", borderRadius: "10px" }}>
                        No campaigns
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#94A3B8", fontSize: "12px", margin: "0 0 20px 0", wordBreak: "break-all" }}>
                    {c.domain}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                        {c.campaignsCount}
                      </div>
                      <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "2px" }}>
                        CAMPAIGNS
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                        {c.repliesCount}
                      </div>
                      <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "2px" }}>
                        REPLIES
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                        {c.linksCount}
                      </div>
                      <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "2px" }}>
                        LINKS
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "12px", fontSize: "11.5px", color: "#64748B" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>Sent (total)</span>
                    <span style={{ color: "#0F172A", fontWeight: "600" }}>{c.sentTotal}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>Sent (30d)</span>
                    <span style={{ color: "#0F172A", fontWeight: "600" }}>{c.sent30d}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: c.unreadReplies > 0 ? "4px" : 0 }}>
                    <span>Reply rate</span>
                    <span style={{ color: "#0F172A", fontWeight: "600" }}>{c.replyRate}</span>
                  </div>
                  {c.unreadReplies > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#0F766E", fontWeight: "700", marginTop: "4px" }}>
                      <span>Unread</span>
                      <span>{c.unreadReplies} replies</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
