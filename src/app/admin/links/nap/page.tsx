"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface NapClient {
  id: string;
  name: string;
  domain: string;
  score: string | null;
  citationsCount: number;
  incompleteWarning: string | null;
}

export default function NapCheckerPage() {
  const [clients, setClients] = useState<NapClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/links/nap");
        if (res.ok) {
          const json = await res.json();
          setClients(json.clients || []);
        }
      } catch (err) {
        console.error("Failed to load NAP checker:", err);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "4px" }}>
              <Link href="/admin/links" style={{ color: "#64748B", textDecoration: "none" }}>&larr; Link Building</Link>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              NAP Checker
            </h1>
          </div>

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
        </div>

        {/* Subtitle Banner */}
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "28px",
            color: "#1E40AF",
            fontSize: "12px",
            lineHeight: "1.5"
          }}
        >
          Check each client&apos;s <strong>name, address, phone and website</strong> across the directories they are listed on. Pick a client to manage its citation URLs and run a check. The correct details are set on the client&apos;s edit page; runs and citations live here. Crawls are manual only and the pooled tiers stay behind the Run check button.
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
                  minHeight: "200px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                    {c.name}
                  </h3>
                  <p style={{ color: "#94A3B8", fontSize: "12px", margin: "0 0 16px 0", wordBreak: "break-all" }}>
                    {c.domain}
                  </p>

                  {c.incompleteWarning && (
                    <div
                      style={{
                        background: "#FEF3C7",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginBottom: "16px",
                        color: "#92400E",
                        fontSize: "11.5px"
                      }}
                    >
                      Correct details incomplete: {c.incompleteWarning}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                        {c.score || "—"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                        Correct score
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                        {c.citationsCount}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                        Citations
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    style={{
                      background: "#4F46E5",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Open
                  </button>

                  {c.incompleteWarning && (
                    <button
                      type="button"
                      style={{
                        background: "white",
                        color: "#334155",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        fontSize: "12.5px",
                        fontWeight: "500",
                        cursor: "pointer"
                      }}
                    >
                      Set details
                    </button>
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
