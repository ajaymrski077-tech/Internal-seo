"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Play, Pause, Archive, Trash2, Calendar, Link2, Tag, TrendingUp, BarChart2, Eye, MousePointer, Activity, Award } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface KeywordSnapshot {
  id: number;
  date: string;
  position: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
}

interface KeywordDetail {
  id: number;
  keyword: string;
  normalizedKeyword: string;
  clientId: number;
  client: { name: string };
  propertyId: number;
  property: { domain: string };
  status: string;
  tags: string;
  targetUrl: string | null;
  createdAt: string;
  snapshots: KeywordSnapshot[];
  activityLogs: Array<{ id: number; actorEmail: string; action: string; createdAt: string; metadata: string }>;
}

export default function KeywordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const keywordId = params?.keywordId as string;

  const [keyword, setKeyword] = useState<KeywordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit fields state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchKeywordDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rankings/keywords/${keywordId}`);
      if (res.ok) {
        const data = await res.json();
        setKeyword(data);
        setEditTargetUrl(data.targetUrl || "");
        setEditTags(data.tags || "");
      } else {
        setError("Tracked keyword not found or unauthorized.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load keyword details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (keywordId) {
      fetchKeywordDetail();
    }
  }, [keywordId]);

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/rankings/keywords/${keywordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchKeywordDetail();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleEditModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/rankings/keywords/${keywordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: editTargetUrl.trim() || null,
          tags: editTags.trim(),
        })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchKeywordDetail();
      }
    } catch (err) {
      console.error("Failed to update keyword fields", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKeyword = async () => {
    const confirmDelete = window.confirm("Are you sure you want to stop tracking this keyword?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/rankings/keywords/${keywordId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/rankings");
      }
    } catch (err) {
      console.error("Failed to delete keyword", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8FAFC" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !keyword) {
    return (
      <div style={{ padding: "40px", textShadow: "none", color: "#64748B", background: "#F8FAFC", minHeight: "100vh" }}>
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", border: "1px solid #E2E8F0", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
          <h2>Error</h2>
          <p>{error || "Keyword not found."}</p>
          <Link href="/admin/rankings" style={{ display: "inline-block", marginTop: "16px", color: "#0D9488", textDecoration: "none", fontWeight: "600" }}>
            Back to Rankings
          </Link>
        </div>
      </div>
    );
  }

  // Calculate aggregates
  const snaps = keyword.snapshots || [];
  const latestSnap = snaps[snaps.length - 1] || null;
  const clicksTotal = snaps.reduce((sum, s) => sum + s.clicks, 0);
  const impressionsTotal = snaps.reduce((sum, s) => sum + s.impressions, 0);
  const avgCtr = snaps.length > 0 ? (snaps.reduce((sum, s) => sum + s.ctr, 0) / snaps.length) : 0.0;

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* Back Link */}
      <Link href="/admin/rankings" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748B", textDecoration: "none", fontSize: "13px", marginBottom: "20px", fontWeight: "500" }}>
        <ArrowLeft size={16} />
        Back to Rankings
      </Link>

      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "white", padding: "24px 32px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, color: "#0F172A" }}>{keyword.keyword}</h1>
            <span style={{ 
              background: keyword.status === "ACTIVE" ? "#ECFDF5" : keyword.status === "PAUSED" ? "#FEF3C7" : "#F1F5F9", 
              color: keyword.status === "ACTIVE" ? "#047857" : keyword.status === "PAUSED" ? "#B45309" : "#64748B", 
              padding: "2px 10px", 
              borderRadius: "12px", 
              fontSize: "11px", 
              fontWeight: "600",
              textTransform: "uppercase" 
            }}>
              {keyword.status}
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "13px", color: "#64748B" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <strong>Client:</strong> {keyword.client.name}
            </span>
            <span>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <strong>Domain:</strong> {keyword.property.domain}
            </span>
            {keyword.targetUrl && (
              <>
                <span>•</span>
                <a href={keyword.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                  <Link2 size={14} />
                  Target URL
                </a>
              </>
            )}
          </div>

          {keyword.tags && (
            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
              {keyword.tags.split(",").map(t => (
                <span key={t} style={{ background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Tag size={10} />
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            style={{ padding: "8px 16px", background: "white", color: "#0F172A", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Edit2 size={14} />
            Edit Settings
          </button>
          
          {keyword.status === "ACTIVE" ? (
            <button 
              onClick={() => handleUpdateStatus("PAUSED")}
              style={{ padding: "8px 16px", background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Pause size={14} />
              Pause
            </button>
          ) : (
            <button 
              onClick={() => handleUpdateStatus("ACTIVE")}
              style={{ padding: "8px 16px", background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Play size={14} />
              Resume
            </button>
          )}

          <button 
            onClick={handleDeleteKeyword}
            style={{ padding: "8px 16px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FEE2E2", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Trash2 size={14} />
            Stop Tracking
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        <div style={{ background: "white", padding: "20px 24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Current Position</span>
            <Award size={18} style={{ color: "#0D9488" }} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", marginTop: "8px" }}>{latestSnap?.position || "—"}</div>
          <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginTop: "4px" }}>Latest from GSC sync</span>
        </div>

        <div style={{ background: "white", padding: "20px 24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Clicks (Range Total)</span>
            <MousePointer size={18} style={{ color: "#2563EB" }} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", marginTop: "8px" }}>{clicksTotal}</div>
          <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginTop: "4px" }}>Total user clicks</span>
        </div>

        <div style={{ background: "white", padding: "20px 24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Impressions</span>
            <Eye size={18} style={{ color: "#4F46E5" }} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", marginTop: "8px" }}>{impressionsTotal}</div>
          <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginTop: "4px" }}>Total search views</span>
        </div>

        <div style={{ background: "white", padding: "20px 24px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>Avg Click-Through Rate</span>
            <TrendingUp size={18} style={{ color: "#059669" }} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", marginTop: "8px" }}>{avgCtr.toFixed(2)}%</div>
          <span style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginTop: "4px" }}>Clicks per impression</span>
        </div>

      </div>

      {/* Position History Timeline logs list */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        
        {/* Snapshots Table */}
        <div style={{ background: "white", padding: "24px 32px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0F172A", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <BarChart2 size={18} />
            Daily Rankings History Log
          </h2>

          {snaps.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
              No history snapshots synced yet. Backfills usually compile within property sync pipelines.
            </div>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead style={{ background: "#F8FAFC", position: "sticky", top: 0 }}>
                  <tr style={{ color: "#64748B", textTransform: "uppercase", fontSize: "11px", fontWeight: "600", textAlign: "left" }}>
                    <th style={{ padding: "12px 20px" }}>Date</th>
                    <th style={{ padding: "12px 20px" }}>Position</th>
                    <th style={{ padding: "12px 20px" }}>Clicks</th>
                    <th style={{ padding: "12px 20px" }}>Impressions</th>
                    <th style={{ padding: "12px 20px" }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {[...snaps].reverse().map(s => (
                    <tr key={s.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 20px", color: "#0F172A" }}>
                        {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td style={{ padding: "10px 20px", fontWeight: "600", color: s.position !== null ? "#0F172A" : "#94A3B8" }}>
                        {s.position !== null ? s.position.toFixed(1) : "Not Ranked"}
                      </td>
                      <td style={{ padding: "10px 20px", color: "#475569" }}>{s.clicks}</td>
                      <td style={{ padding: "10px 20px", color: "#475569" }}>{s.impressions}</td>
                      <td style={{ padding: "10px 20px", color: "#475569" }}>{s.ctr.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit / Timeline activity logs */}
        <div style={{ background: "white", padding: "24px 32px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0F172A", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={18} />
            Tracking Activity Audit
          </h2>
          
          {keyword.activityLogs.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#64748B", textAlign: "center", padding: "30px" }}>No activity logs recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {keyword.activityLogs.map(log => (
                <div key={log.id} style={{ borderLeft: "2px solid #E2E8F0", paddingLeft: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A" }}>{log.action.replace("KEYWORD_", "")}</div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>By {log.actorEmail}</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Edit Tracked Keyword Settings</span>
            </div>
            <form onSubmit={handleEditModalSubmit} className={modalStyles.body}>
              
              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Target Landing Page URL</label>
                <input 
                  type="text" 
                  className={modalStyles.input}
                  value={editTargetUrl} 
                  onChange={e => setEditTargetUrl(e.target.value)}
                  placeholder="e.g. https://client.com/pricing"
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Tags (comma separated)</label>
                <input 
                  type="text" 
                  className={modalStyles.input}
                  value={editTags} 
                  onChange={e => setEditTags(e.target.value)}
                  placeholder="e.g. core, sales, blog"
                />
              </div>

            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsEditModalOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>Cancel</button>
              <button onClick={handleEditModalSubmit} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
