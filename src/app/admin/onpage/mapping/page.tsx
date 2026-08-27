"use client";

import { useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

interface MappingClientItem {
  id: string;
  name: string;
  domain: string;
  propertyId: string | null;
  isGscConnected: boolean;
  isMapped: boolean;
  clustersCount: number;
  lastRun: string | null;
}

export default function KeywordMappingPage() {
  const [clients, setClients] = useState<MappingClientItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onpage/mapping/overview");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load keyword mapping clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Breadcrumb & Title */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/admin/onpage" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-block", marginBottom: "4px" }}>
            &larr; On-Page Tools
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Keyword Mapping
          </h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", margin: 0, maxWidth: "800px" }}>
            Pick a client to see their keyword map — one target page per cluster, checked against Search Console, with cannibalisation flagged. Needs a connected Search Console property.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: "28px", maxWidth: "340px" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "10px", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                fontSize: "13px",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                background: "white",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <PageLoader message="Loading..." showSkeleton />
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "white", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
            <p style={{ color: "#64748B", fontSize: "14px" }}>No clients found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" }}>
            {filteredClients.map((client) => {
              return (
                <div
                  key={client.id}
                  style={{
                    background: "white",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "180px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                      {client.name}
                    </h3>
                    <p style={{ color: "#94A3B8", fontSize: "12.5px", margin: "0 0 16px 0", wordBreak: "break-all" }}>
                      {client.domain || "No domain"}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      {!client.isGscConnected ? (
                        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "600" }}>
                          No Search Console
                        </span>
                      ) : client.isMapped ? (
                        <>
                          <span style={{ background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "600" }}>
                            Mapped &middot; {client.clustersCount} clusters
                          </span>
                          {client.lastRun && (
                            <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                              last run {client.lastRun}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "600" }}>
                          Not mapped yet
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {!client.isGscConnected ? (
                      <button
                        disabled
                        style={{
                          background: "#F1F5F9",
                          color: "#94A3B8",
                          border: "none",
                          borderRadius: "6px",
                          padding: "7px 16px",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          cursor: "not-allowed",
                        }}
                      >
                        Build map
                      </button>
                    ) : client.isMapped ? (
                      <Link
                        href={`/admin/onpage/mapping/${client.id}`}
                        style={{
                          background: "#0F4C5C",
                          color: "white",
                          borderRadius: "6px",
                          padding: "7px 16px",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        Open map
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/onpage/mapping/${client.id}?build=true`}
                        style={{
                          background: "#0F4C5C",
                          color: "white",
                          borderRadius: "6px",
                          padding: "7px 16px",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        Build map
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
