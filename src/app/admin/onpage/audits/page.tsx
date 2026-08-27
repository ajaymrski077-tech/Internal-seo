"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Globe, ExternalLink, X, Info } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface ClientAuditSummary {
  id: string;
  name: string;
  domain: string;
  propertyId: string | null;
  totalAudits: number;
  urlsAudited: number;
  lastAudit: string | null;
}

export default function OnPageAuditsPage() {
  const [clients, setClients] = useState<ClientAuditSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientAuditSummary | null>(null);
  
  // New Audit Form
  const [auditUrl, setAuditUrl] = useState("");
  const [auditKeyword, setAuditKeyword] = useState("");
  const [auditProfile, setAuditProfile] = useState<"TRANSACTIONAL" | "INFORMATIONAL">("TRANSACTIONAL");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onpage/clients-summary");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load on-page clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openNewAuditModal = (client?: ClientAuditSummary) => {
    if (client) {
      setSelectedClient(client);
      setAuditUrl(client.domain || "");
    } else if (clients.length > 0) {
      setSelectedClient(clients[0]);
      setAuditUrl(clients[0].domain || "");
    }
    setAuditKeyword("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient?.propertyId) {
      setModalError("Please select a valid client with an active property.");
      return;
    }

    setSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/onpage/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedClient.propertyId,
          url: auditUrl,
          targetKeyword: auditKeyword,
          profile: auditProfile,
          maxPages: 20
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initiate audit");
      }

      setIsModalOpen(false);
      await fetchClients();
    } catch (err: unknown) {
      const errObj = err as Error;
      setModalError(errObj?.message || "Failed to trigger audit.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "32px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <Link href="/admin/onpage" style={{ color: "#64748B", fontSize: "13px", textDecoration: "none", display: "inline-block", marginBottom: "4px" }}>
              &larr; On-Page Tools
            </Link>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
              On-Page Audits
            </h1>
          </div>
          <button
            onClick={() => openNewAuditModal()}
            style={{
              background: "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(79, 70, 229, 0.2)"
            }}
          >
            <Plus size={15} /> + New audit
          </button>
        </div>

        {/* Notice Info Box */}
        <div
          style={{
            background: "#EEF2FF",
            border: "1px solid #E0E7FF",
            borderRadius: "8px",
            padding: "12px 18px",
            marginBottom: "24px",
            color: "#3730A3",
            fontSize: "13px",
            lineHeight: "1.5",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Info size={16} style={{ flexShrink: 0, color: "#4F46E5" }} />
          <div>
            <strong>Internal tool.</strong> Scores are content-readiness signals — they don't predict rankings. Two profiles: <strong>Transactional</strong> (trust signals matter) and <strong>Informational</strong> (topical coverage + information gain).
          </div>
        </div>

        {/* Search & Client Count */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ position: "relative", maxWidth: "320px", marginBottom: "12px" }}>
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
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                background: "white",
                outline: "none",
              }}
            />
          </div>
          <div style={{ fontSize: "13px", color: "#64748B", fontWeight: "500" }}>
            {filteredClients.length} clients
          </div>
        </div>

        {/* Grid of Client Cards */}
        {loading ? (
          <PageLoader message="Loading Audits" subtitle="Fetching SEO audit results" showSkeleton />
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "white", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
            <p style={{ color: "#64748B", fontSize: "14px" }}>No clients matching your search criteria.</p>
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
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" }}>
                      {client.name}
                    </h3>
                    <p style={{ color: "#94A3B8", fontSize: "12.5px", margin: "0 0 20px 0", wordBreak: "break-all" }}>
                      {client.domain || "No domain assigned"}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                          {client.totalAudits}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>total audits</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#0F172A" }}>
                          {client.urlsAudited}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>URLs audited</div>
                      </div>
                    </div>

                    <div style={{ fontSize: "11.5px", color: "#94A3B8", marginBottom: "20px" }}>
                      Last audit: {client.lastAudit ? new Date(client.lastAudit).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
                    <Link
                      href={`/admin/onpage/audits/${client.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        background: "#4F46E5",
                        color: "white",
                        padding: "7px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        textDecoration: "none",
                      }}
                    >
                      View audits
                    </Link>
                    <Link
                      href={`/admin/onpage/mapping?client=${client.id}`}
                      style={{
                        textAlign: "center",
                        background: "white",
                        color: "#334155",
                        border: "1px solid #CBD5E1",
                        padding: "7px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "500",
                        textDecoration: "none",
                      }}
                    >
                      Keyword Map
                    </Link>
                    <button
                      onClick={() => openNewAuditModal(client)}
                      style={{
                        background: "white",
                        color: "#334155",
                        border: "1px solid #CBD5E1",
                        padding: "7px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      + New
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* New Audit Modal */}
      {isModalOpen && (
        <div className={modalStyles.overlay}>
          <div className={modalStyles.modal} style={{ maxWidth: "480px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Start New On-Page SEO Audit</span>
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
                <label className={modalStyles.label}>Client Target</label>
                <select
                  value={selectedClient?.id || ""}
                  onChange={(e) => {
                    const c = clients.find(cl => cl.id === e.target.value);
                    if (c) {
                      setSelectedClient(c);
                      setAuditUrl(c.domain);
                    }
                  }}
                  className={modalStyles.select}
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.domain})</option>
                  ))}
                </select>
              </div>

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
