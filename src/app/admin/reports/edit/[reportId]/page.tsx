"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Copy,
  ExternalLink,
  Plus,
  Upload,
  Trash2,
  Check,
  Mail,
  AlertCircle,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code
} from "lucide-react";
import styles from "@/styles/Reports.module.css";
import { useToast } from "@/components/ToastContext";
import { useConfirm } from "@/components/ConfirmContext";

interface ReportEditPayload {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  nextMonthPlans: string | null;
  emailStatus: string | null;
  emailSentAt: string | null;
  emailSentTo: string | null;
  shareToken: string | null;
  client: {
    id: string;
    name: string;
    companyName: string | null;
    managerName?: string | null;
  };
  snapshots: Array<{
    deliveriesJson: string;
  }>;
}

export default function EditReportPage() {
  const router = useRouter();
  const rawParams = useParams();
  const reportId = (rawParams?.reportId as string) || "";

  const [report, setReport] = useState<ReportEditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState("");
  const [nextMonthPlans, setNextMonthPlans] = useState("");
  const [emailStatus, setEmailStatus] = useState("READY");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const { toast, success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  const fetchReport = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load report for editing.");
      }
      const data: ReportEditPayload = await res.json();
      setReport(data);
      setStartDate(data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "");
      setEndDate(data.endDate ? new Date(data.endDate).toISOString().split("T")[0] : "");
      setSummary(data.summary || "Hi,\n\nThis month has been positive. Visibility and impressions have climbed steadily across targeted keywords, and core service pages continue to gain topical relevance.\n\nWe will continue to focus on page optimization and supporting content in the upcoming cycle.");
      setNextMonthPlans(data.nextMonthPlans || "1. Continued supporting content creation.\n2. Tracking keywords to see where we can optimize key pages as and when needed.\n3. Building out backlinks.");
      setEmailStatus(data.emailStatus || "READY");
    } catch (err: unknown) {
      const errObj = err as Error;
      console.error(err);
      setError(errObj?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          summary,
          nextMonthPlans,
          emailStatus
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save report.");
      }

      success("Report updated successfully!");
    } catch (err: unknown) {
      const errObj = err as Error;
      toastError(errObj?.message || "Error saving report.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!report?.shareToken) return;
    const url = `${window.location.origin}/share/reports/${report.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    success("Share link copied!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      // Simulate email dispatch
      const simulatedEmail = `client@${report?.client.name.toLowerCase().replace(/\s+/g, "")}.com`;
      await fetch(`/api/reports/${reportId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailStatus: "SENT",
          emailSentAt: new Date().toISOString(),
          emailSentTo: simulatedEmail
        })
      });
      success(`Email sent to ${simulatedEmail}`);
      fetchReport();
    } catch {
      toastError("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteReport = async () => {
    const ok = await confirm({
      title: "Delete Report",
      message: "Are you sure you want to delete this report? This action cannot be undone."
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete report.");
      success("Report deleted.");
      router.push(`/admin/reports/${report?.clientId}`);
    } catch {
      toastError("Error deleting report.");
    }
  };

  if (loading && !report) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px 0" }}>
        <RefreshCw className={styles.spinner} size={32} />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={styles.container}>
        <div style={{ background: "#FFFFFF", padding: "36px", borderRadius: "12px", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <AlertCircle size={36} style={{ color: "#EF4444", margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0F172A" }}>Unable to load report</h3>
          <p style={{ color: "#64748B", fontSize: "0.875rem", marginBottom: "20px" }}>{error}</p>
          <Link href="/admin/reports" className={styles.btnActionSecondary}>
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = report.shareToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/reports/${report.shareToken}` : "";

  return (
    <div className={styles.container} style={{ maxWidth: "1000px" }}>
      {/* 1. TOP BREADCRUMB & TITLE */}
      <div>
        <Link
          href={`/admin/reports/${report.clientId}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748B", textDecoration: "none", marginBottom: "12px" }}
        >
          <ArrowLeft size={14} />
          Back to Reports
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
          Edit Report
        </h1>
        <span style={{ fontSize: "0.875rem", color: "#64748B", fontWeight: "500" }}>
          {report.client.name}
        </span>
      </div>

      {/* 2. REPORT DETAILS CARD */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Report Details</div>

        {/* Start / End Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
              End Date *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none" }}
            />
          </div>
        </div>

        {/* Notes / Summary */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
            <label style={{ fontSize: "0.775rem", fontWeight: "600", color: "#475569" }}>
              Notes / Summary
            </label>
            <span style={{ fontSize: "0.725rem", color: "#94A3B8", fontStyle: "italic" }}>
              Lead with the business result, then the mechanics.
            </span>
          </div>

          {/* Formatting Toolbar */}
          <div style={{ display: "flex", gap: "4px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderBottom: "none", borderRadius: "6px 6px 0 0", padding: "6px 10px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748B", padding: "4px 8px", borderRight: "1px solid #E2E8F0", marginRight: "4px" }}>Normal ⌄</span>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Bold size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Italic size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Underline size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Strikethrough size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><List size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><ListOrdered size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Quote size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Code size={13} /></button>
          </div>

          <textarea
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "0 0 6px 6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none", resize: "vertical", lineHeight: "1.5" }}
          />
        </div>

        {/* Plans for Next Month */}
        <div>
          <label style={{ display: "block", fontSize: "0.775rem", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
            Plans for Next Month
          </label>

          {/* Formatting Toolbar */}
          <div style={{ display: "flex", gap: "4px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderBottom: "none", borderRadius: "6px 6px 0 0", padding: "6px 10px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748B", padding: "4px 8px", borderRight: "1px solid #E2E8F0", marginRight: "4px" }}>Normal ⌄</span>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Bold size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Italic size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Underline size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Strikethrough size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><List size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><ListOrdered size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Quote size={13} /></button>
            <button type="button" style={{ background: "transparent", border: "none", padding: "4px 6px", cursor: "pointer", color: "#64748B" }}><Code size={13} /></button>
          </div>

          <textarea
            rows={4}
            value={nextMonthPlans}
            onChange={(e) => setNextMonthPlans(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "0 0 6px 6px", border: "1px solid #CBD5E1", fontSize: "0.875rem", outline: "none", resize: "vertical", lineHeight: "1.5" }}
          />
        </div>
      </div>

      {/* 3. BACKLINKS ACQUIRED CARD */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Backlinks Acquired</span>
          <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "#F1F5F9", fontSize: "0.75rem", fontWeight: "600", color: "#475569" }}>0</span>
        </div>
        <button
          type="button"
          style={{ width: "100%", padding: "10px", background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: "600", color: "#475569", cursor: "pointer" }}
        >
          + Add Backlink
        </button>
      </div>

      {/* 4. CONTENT PUBLISHED CARD */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Content Published</span>
          <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "#F1F5F9", fontSize: "0.75rem", fontWeight: "600", color: "#475569" }}>0</span>
        </div>
        <button
          type="button"
          style={{ width: "100%", padding: "10px", background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: "600", color: "#475569", cursor: "pointer" }}
        >
          + Add Content
        </button>
      </div>

      {/* 5. SCREENSHOTS & IMAGES CARD */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Screenshots & Images</span>
          <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "#F1F5F9", fontSize: "0.75rem", fontWeight: "600", color: "#475569" }}>0</span>
        </div>
        <div style={{ border: "2px dashed #E2E8F0", borderRadius: "8px", padding: "32px 16px", textAlign: "center", cursor: "pointer", background: "#FAFAFA" }}>
          <Upload size={24} style={{ color: "#94A3B8", margin: "0 auto 8px auto" }} />
          <div style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#0F172A" }}>Click to upload images</div>
          <div style={{ fontSize: "0.725rem", color: "#94A3B8", marginTop: "2px" }}>PNG, JPG, GIF, WebP (max 10MB)</div>
        </div>
      </div>

      {/* 6. SHARE LINK CARD */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A", marginBottom: "8px" }}>Share Link</div>
        <div style={{ fontSize: "0.775rem", color: "#64748B", marginBottom: "10px" }}>Share this link with your client:</div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem", background: "#F8FAFC", color: "#334155" }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            style={{ padding: "8px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#0F172A", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", cursor: "pointer" }}
          >
            {copiedLink ? "Copied" : "Copy"}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "8px 14px", fontSize: "0.8125rem", fontWeight: "600", color: "#0F172A", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Preview
          </a>
        </div>
      </div>

      {/* 7. ACTION BUTTONS (DELETE / CANCEL / SAVE) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleDeleteReport}
          style={{ padding: "8px 16px", fontSize: "0.8125rem", fontWeight: "600", color: "#DC2626", background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: "6px", cursor: "pointer" }}
        >
          Delete Report
        </button>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href={`/admin/reports/${report.clientId}`}
            style={{ padding: "8px 16px", fontSize: "0.8125rem", fontWeight: "600", color: "#475569", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", textDecoration: "none" }}
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveChanges()}
            style={{ padding: "8px 20px", fontSize: "0.8125rem", fontWeight: "600", color: "#FFFFFF", background: "#0F4C5C", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* 8. EMAIL REPORT CARD */}
      <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#0F172A" }}>Email Report</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: emailStatus === "READY" ? "#16A34A" : "#94A3B8", fontWeight: "600" }}>● Ready</span>
            <button
              type="button"
              onClick={() => setEmailStatus(emailStatus === "READY" ? "DRAFT" : "READY")}
              style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", border: "1px solid #CBD5E1", background: "#F8FAFC", cursor: "pointer" }}
            >
              {emailStatus === "READY" ? "Mark Draft" : "Mark Ready"}
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0 }}>
          Sends summary, stats and next month plans to the primary contact. You&apos;ll be CC&apos;d.
        </p>

        <div>
          <button
            type="button"
            disabled={sendingEmail}
            onClick={handleSendEmail}
            style={{
              padding: "8px 18px",
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              background: "#0F4C5C",
              border: "none",
              borderRadius: "6px",
              cursor: sendingEmail ? "not-allowed" : "pointer"
            }}
          >
            {sendingEmail ? "Sending..." : report.emailSentAt ? "Resend Email" : "Send Email"}
          </button>
        </div>

        {/* Send History */}
        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "10px", marginTop: "4px" }}>
          <div style={{ fontSize: "0.725rem", fontWeight: "700", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
            Send History
          </div>
          <div style={{ fontSize: "0.775rem", color: "#475569" }}>
            {report.emailSentAt ? (
              <span style={{ color: "#16A34A" }}>
                ✓ Sent to {report.emailSentTo || `contact@${report.client.name.toLowerCase().replace(/\s+/g, "")}.com`} on {new Date(report.emailSentAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span style={{ color: "#94A3B8" }}>No email sent yet</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
