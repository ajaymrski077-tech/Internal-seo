"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search,
  ExternalLink,
  AlertCircle,
  Archive,
  RefreshCw
} from "lucide-react";
import styles from "@/styles/Reports.module.css";

interface ClientReportSummary {
  id: string;
  name: string;
  domain: string;
  totalReports: number;
  mostRecentReport: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  } | null;
}

export default function ReportsDirectoryPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchClientsSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/clients-summary?search=${encodeURIComponent(search)}&archived=${showArchived}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load reports summary.");
      }
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Error loading reports list.");
    } finally {
      setLoading(false);
    }
  }, [search, showArchived, router]);

  useEffect(() => {
    fetchClientsSummary();
  }, [fetchClientsSummary]);

  return (
    <div className={styles.container}>
      {/* 1. PAGE HEADER */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Manage monthly SEO reports for clients</p>
        </div>

        <div>
          <button
            className={`${styles.btnActionSecondary} ${showArchived ? styles.activeArchivedBtn : ""}`}
            onClick={() => setShowArchived(!showArchived)}
            style={{ fontSize: "0.8125rem", padding: "8px 16px", borderRadius: "6px" }}
          >
            <Archive size={14} />
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR & CLIENTS COUNT */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
          <Search
            size={16}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
          />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              fontSize: "0.875rem",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#0F172A",
              outline: "none"
            }}
          />
        </div>

        <div style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: "500" }}>
          {clients.length} {clients.length === 1 ? "client" : "clients"}
        </div>
      </div>

      {/* 3. CLIENTS REPORTS TABLE */}
      {loading && clients.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <RefreshCw className={styles.spinner} size={28} />
        </div>
      ) : error ? (
        <div className={styles.errorCard} style={{ background: "#FFFFFF", padding: "32px", borderRadius: "12px", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "#EF4444", margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#0F172A" }}>Unable to load reports</h3>
          <p style={{ fontSize: "0.875rem", color: "#64748B", marginBottom: "16px" }}>{error}</p>
          <button className={styles.btnActionSecondary} onClick={() => fetchClientsSummary()}>
            Try Again
          </button>
        </div>
      ) : clients.length === 0 ? (
        <div style={{ background: "#FFFFFF", padding: "48px 24px", borderRadius: "12px", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <p style={{ color: "#64748B", fontSize: "0.9375rem" }}>
            {search ? `No clients found matching "${search}"` : "No clients configured yet."}
          </p>
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "14px 24px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  CLIENT
                </th>
                <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TOTAL REPORTS
                </th>
                <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  MOST RECENT REPORT
                </th>
                <th style={{ padding: "14px 24px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const recentMonth = c.mostRecentReport
                  ? new Date(c.mostRecentReport.startDate).toLocaleDateString(undefined, { month: "long", year: "numeric" })
                  : "—";
                const createdDate = c.mostRecentReport
                  ? `Created ${new Date(c.mostRecentReport.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
                  : "";

                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "18px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <Link
                          href={`/admin/reports/${c.id}`}
                          style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#0F172A", textDecoration: "none" }}
                        >
                          {c.name}
                        </Link>
                        <a
                          href={`https://${c.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "0.775rem", color: "#64748B", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          https://{c.domain}/
                        </a>
                      </div>
                    </td>

                    <td style={{ padding: "18px 20px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          background: "#F1F5F9",
                          fontSize: "0.8125rem",
                          fontWeight: "500",
                          color: "#334155"
                        }}
                      >
                        {c.totalReports} {c.totalReports === 1 ? "report" : "reports"}
                      </span>
                    </td>

                    <td style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0F172A" }}>
                          {recentMonth}
                        </span>
                        {createdDate && (
                          <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                            {createdDate}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "18px 24px", textAlign: "right" }}>
                      <Link
                        href={`/admin/reports/${c.id}`}
                        style={{
                          display: "inline-block",
                          padding: "6px 14px",
                          fontSize: "0.8125rem",
                          fontWeight: "600",
                          color: "#0F172A",
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "6px",
                          textDecoration: "none",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        Manage Reports
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
