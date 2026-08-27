"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, Check, ExternalLink } from "lucide-react";

interface BacklinkAnalysisClient {
  id: string;
  name: string;
  domain: string;
  hasClientData: boolean;
  competitorsCount: number;
  updatedDate: string | null;
}

export default function BacklinkAnalysisPage() {
  const [clients, setClients] = useState<BacklinkAnalysisClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/analysis/overview");
        if (res.ok) {
          const json = await res.json();
          setClients(json.clients || []);
        }
      } catch (err) {
        console.error("Failed to load backlink analysis:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, []);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Top Mint Guide Banner */}
        <div
          style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            padding: "10px 18px",
            marginBottom: "24px",
            color: "#065F46",
            fontSize: "12.5px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          &bull; Want to see how to use this tool? <strong>Click here</strong>
        </div>

        {/* Breadcrumb & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
              <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>Backlinks</Link> &gt; Link Analysis
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Backlink Analysis
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Upload Ahrefs exports to analyse client and competitor profiles
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
              Show archived
            </button>
            <Link
              href="/admin/links"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                textDecoration: "none"
              }}
            >
              &larr; Backlinks
            </Link>
          </div>
        </div>

        {/* 3-Column Card Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <PageLoader message="Loading..." showSkeleton />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            {clients.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "white",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "180px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "15.5px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                    {c.name}
                  </h3>
                  <p style={{ color: "#94A3B8", fontSize: "12px", margin: "0 0 20px 0", wordBreak: "break-all" }}>
                    {c.domain}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A", display: "flex", alignItems: "center", gap: "4px" }}>
                        {c.hasClientData ? <Check size={20} color="#059669" strokeWidth={3} /> : "—"}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "4px" }}>
                        CLIENT DATA
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                        {c.competitorsCount}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", letterSpacing: "0.05em", marginTop: "4px" }}>
                        COMPETITORS
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  {c.hasClientData ? (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11.5px" }}>
                      <span style={{ background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                        Client uploaded
                      </span>
                      <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                        {c.competitorsCount} competitors
                      </span>
                      {c.updatedDate && (
                        <span style={{ color: "#94A3B8" }}>
                          {c.updatedDate}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: "#94A3B8", fontSize: "11.5px" }}>
                      No data yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
