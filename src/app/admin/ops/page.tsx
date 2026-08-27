"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, AlertCircle, CheckCircle, Clock, Database, HardDrive, RefreshCw, Server, Shield, Mail } from "lucide-react";

export default function OpsDashboardPage() {
  const [refreshing, setRefreshing] = useState(false);

  const [services, setServices] = useState([]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
              Operations Dashboard
            </h1>
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>
              System health, service telemetry, cron jobs, and background workers
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/admin/ops/errors"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <AlertCircle size={14} color="#EF4444" /> App Errors (0)
            </Link>

            <Link
              href="/admin/ops/email-health"
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "12.5px",
                fontWeight: "500",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Mail size={14} color="#0F766E" /> Email Health
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
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
              <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> Refresh Status
            </button>
          </div>
        </div>

        {/* 4 Top Health Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B" }}>SYSTEM STATUS</span>
              <CheckCircle size={15} color="#10B981" />
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#10B981" }}>
              All Systems Operational
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
              99.96% overall uptime
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B" }}>ACTIVE BACKGROUND JOBS</span>
              <Activity size={15} color="#0F4C5C" />
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A" }}>
              4 Running
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
              Rankings sync, GSC ingest, Links
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B" }}>DATABASE REPLICA</span>
              <Database size={15} color="#0F4C5C" />
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A" }}>
              Healthy
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
              12ms ping &middot; MongoDB Atlas
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B" }}>ERROR RATE (24H)</span>
              <Shield size={15} color="#10B981" />
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#10B981" }}>
              0.00%
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
              0 unhandled exceptions
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "28px" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A", margin: 0 }}>
              Connected Services &amp; Daemon Status
            </h3>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "10px 18px", textAlign: "left", fontWeight: "600", fontSize: "11px" }}>SERVICE</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", fontSize: "11px" }}>STATUS</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>LATENCY</th>
                <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>UPTIME</th>
                <th style={{ padding: "10px 18px", textAlign: "right", fontWeight: "600", fontSize: "11px" }}>LAST CHECKED</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    No services configured.
                  </td>
                </tr>
              ) : services.map((svc: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 20px", fontWeight: "600", color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Server size={14} color="#64748B" />
                    {svc.name}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#F0FDF4", color: "#166534", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>
                      <CheckCircle size={10} /> {svc.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", color: "#64748B", fontFamily: "monospace" }}>{svc.latency}</td>
                  <td style={{ padding: "12px 20px", color: "#0F766E", fontWeight: "600" }}>{svc.uptime}</td>
                  <td style={{ padding: "12px 20px", color: "#64748B" }}>{svc.lastCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
