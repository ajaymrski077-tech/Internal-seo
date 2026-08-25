"use client";

import { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle, Globe, MapPin, Phone, Trash2, Calendar, ShieldCheck, Eye, MousePointerClick, MessageSquare, BookOpen, Navigation } from "lucide-react";
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

interface Snapshot {
  date: string;
  viewsSearch: number;
  viewsMaps: number;
  clicksWebsite: number;
  clicksCall: number;
  clicksDirections: number;
  messages: number;
  bookings: number;
}

interface Totals {
  viewsSearch: number;
  viewsMaps: number;
  clicksWebsite: number;
  clicksCall: number;
  clicksDirections: number;
  messages: number;
  bookings: number;
  interactions: number;
}

export default function GbpLocationDetail() {
  const params = useParams();
  const router = useRouter();
  const locationId = parseInt(params.id as string, 10);

  const [location, setLocation] = useState<Location | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [range, setRange] = useState("30d");

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/gbp/locations/${locationId}`);
      if (res.ok) {
        const data = await res.json();
        setLocation(data.location);
      }
    } catch (err) {
      console.error("Failed to load GBP location:", err);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch(`/api/gbp/locations/${locationId}/performance?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
        setTotals(data.totals);
      }
    } catch (err) {
      console.error("Failed to load GMB performance:", err);
    }
  };

  useEffect(() => {
    if (isNaN(locationId)) return;
    
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchDetails(), fetchPerformance()]);
      setLoading(false);
    };
    loadAll();
  }, [locationId, range]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/gbp/locations/${locationId}/sync`, { method: "POST" });
      if (res.ok) {
        await Promise.all([fetchDetails(), fetchPerformance()]);
      }
    } catch (err) {
      console.error("Failed to sync GMB location:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this location? All local performance histories will be deleted from the database.")) return;
    try {
      const res = await fetch(`/api/gbp/locations/${locationId}/disconnect`, { method: "POST" });
      if (res.ok) {
        router.push("/admin/gbp");
      }
    } catch (err) {
      console.error("Failed to disconnect location:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!location) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <AlertTriangle size={48} style={{ color: "#DC2626", marginBottom: "16px" }} />
        <h2>Location Profile Not Found</h2>
        <button onClick={() => router.push("/admin/gbp")} className={styles.btnSecondary} style={{ marginTop: "12px" }}>
          Back to GBP Portfolio
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => router.push("/admin/gbp")} style={{ padding: "8px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", cursor: "pointer" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>{location.clientName}</span>
            <h1 style={{ fontSize: "20px", fontWeight: "600", margin: "2px 0 0 0", color: "#0F172A" }}>{location.displayName}</h1>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#475569"
            }}
          >
            <RefreshCw size={14} className={syncing ? "spin" : ""} />
            {syncing ? "Syncing..." : "Sync Daily Metrics"}
          </button>
          <button
            onClick={handleDisconnect}
            style={{
              padding: "8px 16px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#DC2626",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Trash2 size={14} />
            Disconnect Listing
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* Info Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Metadata Card */}
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 16px 0", color: "#0F172A" }}>Listing Information</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#64748B", display: "block", marginBottom: "4px" }}>Primary Category</span>
                <strong style={{ color: "#0F172A" }}>{location.primaryCategory || "N/A"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", display: "block", marginBottom: "4px" }}>Storefront Address</span>
                <strong style={{ color: "#0F172A", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <MapPin size={14} style={{ color: "#94A3B8", marginTop: "2px" }} />
                  {location.address || "No address listed"}
                </strong>
              </div>
              <div>
                <span style={{ color: "#64748B", display: "block", marginBottom: "4px" }}>Primary Phone</span>
                <strong style={{ color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={14} style={{ color: "#94A3B8" }} />
                  {location.phone || "No phone listed"}
                </strong>
              </div>
              {location.websiteUri && (
                <div>
                  <span style={{ color: "#64748B", display: "block", marginBottom: "4px" }}>Primary Website</span>
                  <a href={location.websiteUri} target="_blank" rel="noreferrer" style={{ color: "#0D9488", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {location.websiteUri}
                    <Globe size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Sync status card */}
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 12px 0", color: "#0F172A" }}>Sync Performance Status</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Connection Status</span>
                <strong style={{ color: location.syncStatus === "CONNECTED" ? "#059669" : "#DC2626" }}>
                  {location.syncStatus}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Last Synchronized</span>
                <strong style={{ color: "#0F172A" }}>
                  {location.lastSyncTime ? new Date(location.lastSyncTime).toLocaleString() : "Never"}
                </strong>
              </div>
              {location.syncError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", padding: "10px", borderRadius: "6px", marginTop: "10px" }}>
                  <strong>Sync Error:</strong> {location.syncError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Controls & Metrics card */}
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Local SEO Performance Summary</h2>
              
              {/* Range Selector */}
              <div style={{ display: "flex", gap: "6px" }}>
                {["7d", "30d", "90d"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    style={{
                      padding: "4px 10px",
                      background: range === r ? "#0F172A" : "white",
                      color: range === r ? "white" : "#475569",
                      border: "1px solid #E2E8F0",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {totals ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "12px" }}>
                    <Eye size={14} />
                    <span>Search Views</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "8px", color: "#0F172A" }}>
                    {totals.viewsSearch + totals.viewsMaps}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Search: {totals.viewsSearch} | Maps: {totals.viewsMaps}
                  </span>
                </div>

                <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "12px" }}>
                    <MousePointerClick size={14} />
                    <span>Website Clicks</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "8px", color: "#0F172A" }}>
                    {totals.clicksWebsite}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Clicks from listing storefront
                  </span>
                </div>

                <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "12px" }}>
                    <Navigation size={14} />
                    <span>Calls & Directions</span>
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "8px", color: "#0F172A" }}>
                    {totals.clicksCall + totals.clicksDirections}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Calls: {totals.clicksCall} | Directions: {totals.clicksDirections}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: "#64748B", fontSize: "13px", padding: "20px 0" }}>No performance data collected.</div>
            )}
          </div>

          {/* Historical Timeseries table */}
          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "#0F172A" }}>Daily Performance History</h3>
            </div>
            
            {snapshots.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                No performance snapshots mapped for this time period.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                    <th style={{ padding: "12px 20px" }}>Date</th>
                    <th style={{ padding: "12px 20px" }}>Search Views</th>
                    <th style={{ padding: "12px 20px" }}>Maps Views</th>
                    <th style={{ padding: "12px 20px" }}>Website Clicks</th>
                    <th style={{ padding: "12px 20px" }}>Call Clicks</th>
                    <th style={{ padding: "12px 20px" }}>Directions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((snap) => (
                    <tr key={snap.date} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 20px", fontWeight: "600", color: "#0F172A" }}>{snap.date}</td>
                      <td style={{ padding: "12px 20px" }}>{snap.viewsSearch}</td>
                      <td style={{ padding: "12px 20px" }}>{snap.viewsMaps}</td>
                      <td style={{ padding: "12px 20px" }}>{snap.clicksWebsite}</td>
                      <td style={{ padding: "12px 20px" }}>{snap.clicksCall}</td>
                      <td style={{ padding: "12px 20px" }}>{snap.clicksDirections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
