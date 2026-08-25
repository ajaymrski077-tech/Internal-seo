"use client";

import { useState, useEffect } from "react";
import { Globe, RefreshCw, AlertTriangle, ShieldCheck, MapPin, Phone, ExternalLink, Calendar, Plus, Navigation } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";

interface Location {
  id: number;
  locationName: string;
  displayName: string;
  address: string | null;
  phone: string | null;
  websiteUri: string | null;
  primaryCategory: string | null;
  syncStatus: string;
  syncError: string | null;
  lastSyncTime: string | null;
  clientId: number;
  clientName: string;
  domain: string;
}

export default function GbpDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/gbp/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error("Failed to load GMB locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSyncLocation = async (e: React.MouseEvent, locationId: number) => {
    e.stopPropagation(); // Prevent card navigation
    setSyncingId(locationId);
    try {
      const res = await fetch(`/api/gbp/locations/${locationId}/sync`, {
        method: "POST"
      });
      if (res.ok) {
        fetchLocations();
      }
    } catch (err) {
      console.error("Failed to sync GMB location:", err);
    } finally {
      setSyncingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    if (status === "CONNECTED") { bg = "#ECFDF5"; color = "#059669"; }
    else if (status === "SYNCING") { bg = "#EFF6FF"; color = "#2563EB"; }
    else if (status === "ERROR") { bg = "#FEF2F2"; color = "#DC2626"; }

    return (
      <span style={{
        background: bg,
        color,
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        textTransform: "capitalize",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px"
      }}>
        {status === "SYNCING" && <RefreshCw size={10} className="spin" style={{ animation: "spin 1s linear infinite" }} />}
        {status.toLowerCase()}
      </span>
    );
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Google Business Profile</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: "14px" }}>Monitor Google Maps search volume, local listing traffic, and storefront directory performance.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div className="spinner" />
        </div>
      ) : locations.length === 0 ? (
        <div style={{ background: "white", padding: "60px", textAlign: "center", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <MapPin style={{ fontSize: "48px", color: "#94A3B8", marginBottom: "16px", margin: "0 auto" }} size={48} />
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>No Locations Connected Yet</h2>
          <p style={{ color: "#64748B", margin: "8px 0 16px 0", fontSize: "13px" }}>Business Profile locations must be connected and mapped through the Client Workspace.</p>
          <a
            href="/admin/clients"
            className={styles.btnPrimary}
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            Go to Clients Workspace
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "20px" }}>
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => window.location.href = `/admin/gbp/locations/${loc.id}`}
              style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "24px",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>{loc.clientName}</span>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "2px 0 0 0", color: "#0F172A" }}>{loc.displayName}</h3>
                  </div>
                  {getStatusBadge(loc.syncStatus)}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#475569", margin: "16px 0" }}>
                  {loc.primaryCategory && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Globe size={14} style={{ color: "#94A3B8" }} />
                      <span>{loc.primaryCategory}</span>
                    </div>
                  )}
                  {loc.address && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <MapPin size={14} style={{ color: "#94A3B8", marginTop: "2px" }} />
                      <span style={{ lineBreak: "anywhere" }}>{loc.address}</span>
                    </div>
                  )}
                  {loc.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Phone size={14} style={{ color: "#94A3B8" }} />
                      <span>{loc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "#64748B" }}>
                  Synced: {loc.lastSyncTime ? new Date(loc.lastSyncTime).toLocaleDateString() : "Never"}
                </span>
                <button
                  onClick={(e) => handleSyncLocation(e, loc.id)}
                  disabled={syncingId === loc.id || loc.syncStatus === "SYNCING"}
                  style={{
                    padding: "6px 12px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#475569"
                  }}
                >
                  <RefreshCw size={12} className={syncingId === loc.id ? "spin" : ""} />
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
