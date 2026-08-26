"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, Globe, Play, X, Trash2, ShieldAlert, Award, ExternalLink, RefreshCw } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface Property {
  id: number;
  domain: string;
  clientId: number;
  clientName: string;
}

interface Audit {
  id: number;
  propertyId: number;
  status: string;
  score: number | null;
  pagesDiscovered: number;
  pagesCrawled: number;
  issuesCritical: number;
  issuesHigh: number;
  issuesMedium: number;
  issuesLow: number;
  issuesInfo: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  domain: string;
  clientName: string;
  errorMessage: string | null;
}

export default function OnPagePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [maxPages, setMaxPages] = useState("100");
  const [maxDepth, setMaxDepth] = useState("5");
  const [respectRobots, setRespectRobots] = useState(true);
  const [startingAudit, setStartingAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    }
  };

  const fetchAudits = async () => {
    try {
      const res = await fetch("/api/onpage/audits");
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }
    } catch (err) {
      console.error("Failed to load audits:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for active running audits
  useEffect(() => {
    fetchProperties();
    fetchAudits();
  }, []);

  useEffect(() => {
    const activeAuditsExist = audits.some(a => a.status === "RUNNING" || a.status === "QUEUED");
    if (!activeAuditsExist) return;

    const interval = setInterval(() => {
      fetchAudits();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [audits]);

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setErrorMsg("Please select a website property.");
      return;
    }

    setStartingAudit(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/onpage/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: parseInt(selectedPropertyId, 10),
          maxPages: parseInt(maxPages, 10),
          maxDepth: parseInt(maxDepth, 10),
          respectRobots
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start audit");
      }

      setIsModalOpen(false);
      fetchAudits();
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj?.message || "An error occurred");
    } finally {
      setStartingAudit(false);
    }
  };

  const handleCancelAudit = async (auditId: number) => {
    if (!confirm("Are you sure you want to cancel this audit?")) return;
    try {
      const res = await fetch(`/api/onpage/audits/${auditId}/cancel`, {
        method: "POST"
      });
      if (res.ok) {
        fetchAudits();
      }
    } catch (err) {
      console.error("Failed to cancel audit:", err);
    }
  };

  const handleDeleteAudit = async (auditId: number) => {
    if (!confirm("Are you sure you want to delete this audit? All page results and issue logs will be permanently removed.")) return;
    try {
      const res = await fetch(`/api/onpage/audits/${auditId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAudits();
      }
    } catch (err) {
      console.error("Failed to delete audit:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    if (status === "COMPLETED") { bg = "#ECFDF5"; color = "#059669"; }
    else if (status === "RUNNING") { bg = "#EFF6FF"; color = "#2563EB"; }
    else if (status === "QUEUED") { bg = "#FEF3C7"; color = "#D97706"; }
    else if (status === "FAILED") { bg = "#FEF2F2"; color = "#DC2626"; }
    else if (status === "CANCELLED") { bg = "#F3F4F6"; color = "#4B5563"; }

    return (
      <span style={{
        background: bg,
        color,
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "capitalize",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px"
      }}>
        {status === "RUNNING" && <RefreshCw size={12} className="spin" style={{ animation: "spin 1s linear infinite" }} />}
        {status.toLowerCase()}
      </span>
    );
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <span style={{ color: "#94A3B8" }}>—</span>;
    let bg = "#EF4444"; // default critical/failed
    if (score >= 90) bg = "#10B981"; // Excellent
    else if (score >= 70) bg = "#F59E0B"; // Moderate
    
    return (
      <span style={{
        background: bg,
        color: "white",
        padding: "2px 8px",
        borderRadius: "6px",
        fontWeight: "700",
        fontSize: "13px"
      }}>
        {score}
      </span>
    );
  };

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>On-Page SEO Audits</h1>
          <p className={styles.subtitle} style={{ margin: "4px 0 0 0" }}>Perform technical crawls to analyze tags, metadata, performance, and canonical health.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedPropertyId("");
            setErrorMsg("");
            setIsModalOpen(true);
          }}
          className={styles.btnPrimary}
          style={{ padding: "8px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} />
          New Audit
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div className="spinner" />
        </div>
      ) : audits.length === 0 ? (
        <div className={styles.emptyState} style={{ background: "white", padding: "60px", textAlign: "center", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <Globe className={styles.emptyIcon} style={{ fontSize: "48px", color: "#94A3B8", marginBottom: "16px" }} />
          <h2 className={styles.emptyTitle} style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>No Audits Performed Yet</h2>
          <p className={styles.emptyDesc} style={{ color: "#64748B", margin: "8px 0 16px 0" }}>Configure and start your first SEO crawl to check performance metrics and critical page health issues.</p>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className={styles.btnPrimary}
            style={{ margin: "0 auto" }}
          >
            <Plus size={14} style={{ marginRight: "4px" }} />
            New Audit
          </button>
        </div>
      ) : (
        <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: "600" }}>
                <th style={{ padding: "16px 20px" }}>Property Domain</th>
                <th style={{ padding: "16px 20px" }}>Client</th>
                <th style={{ padding: "16px 20px" }}>Status</th>
                <th style={{ padding: "16px 20px" }}>SEO Score</th>
                <th style={{ padding: "16px 20px" }}>Progress</th>
                <th style={{ padding: "16px 20px" }}>Critical Issues</th>
                <th style={{ padding: "16px 20px" }}>Audit Date</th>
                <th style={{ padding: "16px 20px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "600" }}>
                    <a href={`/admin/onpage/audits/${audit.id}`} style={{ color: "#0F172A", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {audit.domain}
                      <ExternalLink size={12} style={{ color: "#94A3B8" }} />
                    </a>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#64748B" }}>{audit.clientName}</td>
                  <td style={{ padding: "16px 20px" }}>{getStatusBadge(audit.status)}</td>
                  <td style={{ padding: "16px 20px" }}>{getScoreBadge(audit.score)}</td>
                  <td style={{ padding: "16px 20px", color: "#475569" }}>
                    {audit.pagesCrawled} / {audit.pagesDiscovered} pages
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {audit.issuesCritical > 0 ? (
                      <span style={{ color: "#DC2626", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <ShieldAlert size={14} />
                        {audit.issuesCritical} Critical
                      </span>
                    ) : (
                      <span style={{ color: "#10B981" }}>0 Critical</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", color: "#64748B" }}>
                    {new Date(audit.createdAt).toLocaleDateString()} at {new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <a href={`/admin/onpage/audits/${audit.id}`} style={{ padding: "6px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", borderRadius: "6px", textDecoration: "none", fontWeight: "600" }}>
                        View Details
                      </a>
                      {(audit.status === "RUNNING" || audit.status === "QUEUED") ? (
                        <button onClick={() => handleCancelAudit(audit.id)} style={{ padding: "6px 12px", background: "#FFF7ED", border: "1px solid #FED7AA", color: "#EA580C", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                          Cancel
                        </button>
                      ) : (
                        <button onClick={() => handleDeleteAudit(audit.id)} style={{ padding: "6px", background: "white", border: "1px solid #E2E8F0", borderRadius: "6px", color: "#EF4444", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Crawl Modals */}
      {isModalOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Start New On-Page SEO Crawl</span>
              <button onClick={() => setIsModalOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleStartAudit} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <ShieldAlert size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Website Property</label>
                <select
                  className={modalStyles.input}
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  required
                >
                  <option value="">-- Select Property to Crawl --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.domain} ({p.clientName})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Maximum Pages</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    className={modalStyles.input}
                    value={maxPages}
                    onChange={(e) => setMaxPages(e.target.value)}
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Maximum Crawl Depth</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className={modalStyles.input}
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(e.target.value)}
                  />
                </div>
              </div>

              <div className={modalStyles.formGroup} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <input
                  type="checkbox"
                  id="respectRobots"
                  checked={respectRobots}
                  onChange={(e) => setRespectRobots(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="respectRobots" className={modalStyles.label} style={{ margin: 0, cursor: "pointer", fontSize: "13px" }}>
                  Respect robots.txt and sitemaps configuration
                </label>
              </div>

              <div style={{ padding: "12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", color: "#64748B" }}>
                ⚠️ <strong>Safety Warning:</strong> Crawler runs asynchronously in a limited background thread pool. Running high-volume crawls on external domains or private networks is blocked.
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsModalOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={startingAudit}>
                Cancel
              </button>
              <button onClick={handleStartAudit} className={`${modalStyles.btn} ${modalStyles.btnSave}`} style={{ background: "#0D9488" }} disabled={startingAudit}>
                {startingAudit ? "Spawning Crawler..." : "Start Crawl"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
