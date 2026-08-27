"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Plus,
  Eye,
  Edit2,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";

interface ReportItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  shareToken: string | null;
  isArchived: boolean;
  createdAt: string;
  sessions: number;
  sessionsChange: number;
  organicTraffic: number;
  organicTrafficChange: number;
  conversions: number;
  backlinksCount: number;
  contentCount: number;
}

interface ClientReportsWorkspace {
  client: {
    id: string;
    name: string;
    companyName: string | null;
    domain: string;
    createdAt: string;
  };
  kpis: {
    totalReports: number;
    sinceDate: string;
    latestSessions: number;
    latestOrganic: number;
    latestMonth: string;
    backlinksPlaced: number;
    contentPublished: number;
  };
  reports: ReportItem[];
}

export default function ClientReportsManagementPage() {
  const router = useRouter();
  const rawParams = useParams();
  const clientId = (rawParams?.clientId || rawParams?.reportId) as string || "";

  const [data, setData] = useState<ClientReportsWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { toast, success, error: toastError } = useToast();

  const fetchWorkspace = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/client/${clientId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load client reports.");
      }
      const payload: ClientReportsWorkspace = await res.json();
      setData(payload);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Error loading reports.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleCopyShareLink = (report: ReportItem) => {
    if (!report.shareToken) {
      toastError("No share token generated for this report.");
      return;
    }
    const url = `${window.location.origin}/share/reports/${report.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(report.id);
    success("Shareable report link copied!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createStartDate || !createEndDate) {
      toastError("Please select both start and end dates.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: createName || `Monthly Report - ${new Date(createStartDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`,
          dateRange: "custom",
          startDate: createStartDate,
          endDate: createEndDate,
          comparisonRange: "PREV_PERIOD",
          sections: ["overview", "sessions", "organic", "conversions", "deliveries"]
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to create report.");
      }

      const newReport = await res.json();
      // Generate snapshot
      await fetch(`/api/reports/${newReport.id}/regenerate`, { method: "POST" });

      success("Report created and generated successfully!");
      setIsCreateOpen(false);
      setCreateName("");
      setCreateStartDate("");
      setCreateEndDate("");
      fetchWorkspace();
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error creating report.");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
        <RefreshCw className={styles.spinner} size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div style={{ background: "#FFFFFF", padding: "36px", borderRadius: "12px", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <AlertCircle size={36} style={{ color: "#EF4444", margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0F172A" }}>Client Reports Error</h3>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginBottom: "20px" }}>{error || "Client not found."}</p>
          <Link href="/admin/reports" className={styles.btnActionSecondary}>
            <ArrowLeft size={14} />
            Back to Reports Directory
          </Link>
        </div>
      </div>
    );
  }

  const { client, kpis, reports } = data;
  const initial = client.name ? client.name.charAt(0).toUpperCase() : "C";

  return (
    <div className={styles.container}>
      {/* 1. BREADCRUMB */}
      <div style={{ fontSize: "0.8125rem", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/admin/reports" style={{ color: "#64748B", textDecoration: "none" }}>
          Reports
        </Link>
        <span>›</span>
        <span style={{ color: "#0F172A", fontWeight: "600" }}>{client.name}</span>
      </div>

      {/* 2. CLIENT HEADER CARD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "8px",
              background: "#0F4C5C",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "700"
            }}
          >
            {initial}
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
              {client.name}
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "2px 0 0 0" }}>
              Monthly performance reports
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/admin/reports"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#0F172A",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              textDecoration: "none"
            }}
          >
            ← All Clients
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              background: "#0F4C5C",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            + Create Report
          </button>
        </div>
      </div>

      {/* 3. 5 KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
        {/* TOTAL REPORTS */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            TOTAL REPORTS
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", marginTop: "4px" }}>
            {kpis.totalReports}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "2px" }}>
            Since {new Date(kpis.sinceDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </div>
        </div>

        {/* LATEST SESSIONS */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            LATEST SESSIONS
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", marginTop: "4px" }}>
            {kpis.latestSessions.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "2px" }}>
            {kpis.latestMonth}
          </div>
        </div>

        {/* LATEST ORGANIC */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            LATEST ORGANIC
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", marginTop: "4px" }}>
            {kpis.latestOrganic.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "2px" }}>
            {kpis.latestMonth}
          </div>
        </div>

        {/* BACKLINKS PLACED */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            BACKLINKS PLACED
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", marginTop: "4px" }}>
            {kpis.backlinksPlaced}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "2px" }}>
            All time
          </div>
        </div>

        {/* CONTENT PUBLISHED */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            CONTENT PUBLISHED
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0F172A", marginTop: "4px" }}>
            {kpis.contentPublished}
          </div>
          <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "2px" }}>
            All time
          </div>
        </div>
      </div>

      {/* 4. MONTHLY REPORTS LEDGER TABLE */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "14px 24px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                PERIOD
              </th>
              <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                SESSIONS
              </th>
              <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ORGANIC
              </th>
              <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                BACKLINKS
              </th>
              <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                CONTENT
              </th>
              <th style={{ padding: "14px 20px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                CONVERSIONS
              </th>
              <th style={{ padding: "14px 24px", fontSize: "0.75rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "#64748B" }}>
                  No reports generated yet for {client.name}. Click "+ Create Report" to generate one.
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const periodTitle = new Date(r.startDate).toLocaleDateString(undefined, { month: "short", year: "numeric" });
                const periodSub = `${new Date(r.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${new Date(r.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* PERIOD */}
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0F172A" }}>
                          {periodTitle}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                          {periodSub}
                        </span>
                      </div>
                    </td>

                    {/* SESSIONS */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0F172A" }}>
                          {r.sessions.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "600", color: r.sessionsChange >= 0 ? "#16A34A" : "#DC2626", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          {r.sessionsChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {r.sessionsChange >= 0 ? "+" : ""}{r.sessionsChange.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* ORGANIC */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#0F172A" }}>
                          {r.organicTraffic.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "600", color: r.organicTrafficChange >= 0 ? "#16A34A" : "#DC2626", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          {r.organicTrafficChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {r.organicTrafficChange >= 0 ? "+" : ""}{r.organicTrafficChange.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* BACKLINKS */}
                    <td style={{ padding: "16px 20px", fontSize: "0.9375rem", fontWeight: "600", color: "#0F172A" }}>
                      {r.backlinksCount}
                    </td>

                    {/* CONTENT */}
                    <td style={{ padding: "16px 20px", fontSize: "0.9375rem", fontWeight: "600", color: "#0F172A" }}>
                      {r.contentCount}
                    </td>

                    {/* CONVERSIONS */}
                    <td style={{ padding: "16px 20px", fontSize: "0.9375rem", fontWeight: "600", color: "#0F172A" }}>
                      {r.conversions || 0}
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {/* VIEW */}
                        <Link
                          href={`/admin/reports/view/${r.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            fontSize: "0.8125rem",
                            fontWeight: "500",
                            color: "#0F172A",
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            textDecoration: "none"
                          }}
                        >
                          <Eye size={13} />
                          View
                        </Link>

                        {/* EDIT */}
                        <Link
                          href={`/admin/reports/edit/${r.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            fontSize: "0.8125rem",
                            fontWeight: "500",
                            color: "#0F172A",
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            textDecoration: "none"
                          }}
                        >
                          <Edit2 size={13} />
                          Edit
                        </Link>

                        {/* COPY LINK */}
                        <button
                          onClick={() => handleCopyShareLink(r)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            fontSize: "0.8125rem",
                            fontWeight: "500",
                            color: "#0F172A",
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            cursor: "pointer"
                          }}
                        >
                          {copiedId === r.id ? <Check size={13} style={{ color: "#16A34A" }} /> : <Copy size={13} />}
                          {copiedId === r.id ? "Copied" : "Copy Link"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE REPORT MODAL */}
      {isCreateOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "500px",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0F172A", margin: 0 }}>Create Monthly Report</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Report Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`Monthly Report - ${client.name}`}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#475569",
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    padding: "8px 20px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    background: "#0F4C5C",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    opacity: isCreating ? 0.7 : 1
                  }}
                >
                  {isCreating ? "Generating..." : "Create Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
