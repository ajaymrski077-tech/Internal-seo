"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Star, MessageSquare, Image as ImageIcon, Eye, ExternalLink, RefreshCw } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface GbpLocationItem {
  id: string | number;
  displayName: string;
  clientName: string;
  address?: string | null;
  phone?: string | null;
  websiteUri?: string | null;
  syncStatus: string;
  rating?: number;
  reviewsCount?: number;
  verified?: boolean;
}

export default function GbpManagerPage() {
  const [locations, setLocations] = useState<GbpLocationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gbp/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error("Failed to load GBP locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Google Business Profile Manager
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              Live GBP performance, review streams, local map pack rankings, and profile audit status
            </p>
          </div>

          <button
            onClick={fetchLocations}
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
            <RefreshCw size={13} /> Sync All Profiles
          </button>
        </div>

        {/* Location Cards */}
        {loading ? (
          <PageLoader message="Loading Business Profiles" subtitle="Syncing Google Business data" />
        ) : locations.length === 0 ? (
          <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", padding: "48px", textAlign: "center", color: "#64748B" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>No Connected Business Profiles</p>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748B" }}>
              Connect your Google Business Profile in client workspaces to monitor reviews, queries, and calls.
            </p>
            <Link
              href="/admin/clients"
              style={{
                background: "#0F172A",
                color: "white",
                padding: "8px 18px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none"
              }}
            >
              Go to Client Workspaces
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
            {locations.map((loc) => (
              <div
                key={loc.id}
                style={{
                  background: "white",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748B", letterSpacing: "0.4px" }}>
                        {loc.clientName}
                      </span>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", margin: "2px 0 0 0" }}>
                        {loc.displayName}
                      </h3>
                    </div>

                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: loc.syncStatus === "SUCCESS" ? "#ECFDF5" : "#FEF3C7",
                      color: loc.syncStatus === "SUCCESS" ? "#059669" : "#D97706"
                    }}>
                      {loc.syncStatus === "SUCCESS" ? "Connected" : "Pending"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "#64748B", fontSize: "12px", marginBottom: "16px" }}>
                    <MapPin size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span>{loc.address || "Address configured in Google"}</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    {loc.phone || loc.websiteUri || "Verified Profile"}
                  </span>
                  <Link
                    href={`/admin/gbp/locations/${loc.id}`}
                    style={{ fontSize: "12px", color: "#0F4C5C", fontWeight: "700", textDecoration: "none" }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
