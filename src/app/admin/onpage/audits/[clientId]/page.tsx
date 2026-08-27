"use client";

import { use, useState, useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import Link from "next/link";
import { Loader2, Plus, ExternalLink, X, Map } from "lucide-react";
import modalStyles from "@/styles/ClientModal.module.css";

interface AuditedUrlItem {
  id: string;
  auditId: string;
  url: string;
  targetKeyword: string;
  profile: string;
  score: number;
  lastAudit: string;
}

interface ClientDetailData {
  client: {
    id: string;
    name: string;
    domain: string;
    propertyId: string | null;
  };
  auditedUrls: AuditedUrlItem[];
}

export default function ClientOnPageAuditsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Audit Form
  const [auditUrl, setAuditUrl] = useState("");
  const [auditKeyword, setAuditKeyword] = useState("");
  const [auditProfile, setAuditProfile] = useState<"TRANSACTIONAL" | "INFORMATIONAL">("TRANSACTIONAL");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/onpage/client/${resolvedParams.clientId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.client?.domain) {
          setAuditUrl(json.client.domain);
        }
      }
    } catch (err) {
      console.error("Failed to load client audits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.clientId]);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.client.propertyId) {
      setModalError("Client has no associated property.");
      return;
    }

    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/onpage/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: data.client.propertyId,
          url: auditUrl,
          targetKeyword: auditKeyword,
          profile: auditProfile,
          maxPages: 20
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to trigger audit.");
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const errObj = err as Error;
      setModalError(errObj?.message || "Failed to start audit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <PageLoader message="Loading..." showSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#64748B" }}>Client not found.</p>
        <Link href="/admin/onpage/audits" style={{ color: "#4F46E5", textDecoration: "none" }}>
          &larr; Back to On-Page Audits
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <div style={{ marginBottom: "8px", fontSize: "13px", color: "#64748B" }}>
          <Link href="/admin/onpage" style={{ color: "#64748B", textDecoration: "none" }}>
            On-Page
          </Link>{" "}
          &gt;{" "}
          <Link href="/admin/onpage/audits" style={{ color: "#64748B", textDecoration: "none" }}>
            Audits
          </Link>{" "}
          &gt; <span style={{ color: "#0F172A", fontWeight: "600" }}>{data.client.name}</span>
        </div>

        {/* Title & Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
            On-Page: {data.client.name}
          </h1>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link
              href={`/admin/onpage/mapping?client=${data.client.id}`}
              style={{
                background: "white",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "500",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Map size={14} /> Keyword Map
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={15} /> + New audit
            </button>
          </div>
        </div>

        {/* Table of Audited URLs */}
        <div style={{ background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px", letterSpacing: "0.05em" }}>URL</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px", letterSpacing: "0.05em" }}>TARGET KEYWORD</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px", letterSpacing: "0.05em" }}>PROFILE</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px", letterSpacing: "0.05em" }}>SCORE</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: "600", fontSize: "12px", letterSpacing: "0.05em" }}>LAST AUDIT</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: "600", fontSize: "12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {data.auditedUrls.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "14px 20px", color: "#4F46E5", fontWeight: "500", maxWidth: "340px", wordBreak: "break-all" }}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#4F46E5", textDecoration: "none" }}>
                      {item.url}
                    </a>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#334155" }}>
                    {item.targetKeyword}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span
                      style={{
                        background: item.profile === "TRANSACTIONAL" ? "#FEF3C7" : "#DBEAFE",
                        color: item.profile === "TRANSACTIONAL" ? "#B45309" : "#1E40AF",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.02em"
                      }}
                    >
                      {item.profile}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ color: item.score >= 70 ? "#059669" : item.score >= 50 ? "#D97706" : "#DC2626", fontWeight: "700" }}>
                      {item.score}
                    </span>
                    <span style={{ color: "#94A3B8", fontSize: "11.5px" }}>/100</span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#64748B", fontSize: "12.5px" }}>
                    {new Date(item.lastAudit).toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <Link
                      href={`/admin/onpage/audits/${item.auditId}/detail`}
                      style={{
                        background: "white",
                        color: "#334155",
                        border: "1px solid #CBD5E1",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "500",
                        textDecoration: "none",
                        display: "inline-block"
                      }}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* New Audit Modal */}
      {isModalOpen && (
        <div className={modalStyles.overlay}>
          <div className={modalStyles.modal} style={{ maxWidth: "480px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Start New On-Page Audit</span>
              <button onClick={() => setIsModalOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className={modalStyles.form}>
              {modalError && (
                <div style={{ padding: "10px", background: "#FEF2F2", color: "#DC2626", borderRadius: "6px", fontSize: "12.5px" }}>
                  {modalError}
                </div>
              )}

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Page URL to Audit</label>
                <input
                  type="url"
                  value={auditUrl}
                  onChange={(e) => setAuditUrl(e.target.value)}
                  placeholder="https://example.com/target-page"
                  className={modalStyles.input}
                  required
                />
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Target Primary Keyword</label>
                <input
                  type="text"
                  value={auditKeyword}
                  onChange={(e) => setAuditKeyword(e.target.value)}
                  placeholder="e.g. roofers edinburgh"
                  className={modalStyles.input}
                  required
                />
              </div>

              <div className={modalStyles.field}>
                <label className={modalStyles.label}>Audit Profile</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="profile"
                      value="TRANSACTIONAL"
                      checked={auditProfile === "TRANSACTIONAL"}
                      onChange={() => setAuditProfile("TRANSACTIONAL")}
                    />
                    Transactional (Trust Signals)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="profile"
                      value="INFORMATIONAL"
                      checked={auditProfile === "INFORMATIONAL"}
                      onChange={() => setAuditProfile("INFORMATIONAL")}
                    />
                    Informational (Topical Depth)
                  </label>
                </div>
              </div>

              <div className={modalStyles.footer} style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={modalStyles.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={modalStyles.btnPrimary}
                  style={{ background: "#4F46E5" }}
                >
                  {submitting ? "Initiating Audit..." : "Run Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
