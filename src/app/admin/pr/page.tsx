"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Megaphone, AlertCircle, X, ExternalLink, Calendar, HelpCircle, RefreshCw } from "lucide-react";
import styles from "@/styles/SharedModule.module.css";
import modalStyles from "@/styles/ClientModal.module.css";

interface Campaign {
  id: string | number;
  campaignName: string;
  clientId: string | number;
  client: { name: string };
  status: string;
  priority: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  budget: number | null;
  _count: {
    outreachRecords: number;
    placements: number;
  };
}

interface OverviewStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalOutreach: number;
  contactedCount: number;
  responsesCount: number;
  interestedCount: number;
  publishedPlacements: number;
  responseRate: number;
  placementRate: number;
  upcomingFollowUps: number;
  overdueFollowUps: number;
}

export default function PRDashboardPage() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clientsList, setClientsList] = useState<Array<{ id: string | number; name: string }>>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formObjective, setFormObjective] = useState("");
  const [formStatus, setFormStatus] = useState("DRAFT");
  const [formPriority, setFormPriority] = useState("NORMAL");
  const [formStartDate, setFormStartDate] = useState("");
  const [formTargetDate] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOverview = async (clientId?: string) => {
    try {
      const url = clientId && clientId !== "All"
        ? `/api/pr/overview?clientId=${clientId}`
        : "/api/pr/overview";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error("Failed to load PR overview", err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientFilter !== "All") params.set("clientId", clientFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (priorityFilter !== "All") params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search);

      const res = await fetch(`/api/pr/campaigns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients?archived=ACTIVE_ONLY");
      if (res.ok) {
        const data = await res.json();
        setClientsList(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to load clients list", err);
    }
  };

  // Read query params client filtering
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("clientId");
    if (cid) {
      setClientFilter(cid);
    }
    fetchClients();
  }, []);

  useEffect(() => {
    fetchOverview(clientFilter);
    fetchCampaigns();
  }, [clientFilter, statusFilter, priorityFilter, search]);

  const openCreateModal = () => {
    setFormName("");
    setFormClientId(clientsList[0]?.id.toString() || "");
    setFormDesc("");
    setFormObjective("");
    setFormStatus("DRAFT");
    setFormPriority("NORMAL");
    setFormStartDate("");
    setFormBudget("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formClientId) {
      setErrorMsg("Campaign Name and Client are required fields.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/pr/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: formName,
          clientId: parseInt(formClientId, 10),
          description: formDesc,
          objective: formObjective,
          status: formStatus,
          priority: formPriority,
          startDate: formStartDate || null,
          targetDate: formTargetDate || null,
          budget: formBudget ? parseFloat(formBudget) : null,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to create campaign.");
      }

      setIsModalOpen(false);
      fetchCampaigns();
      fetchOverview(clientFilter);
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMsg(errObj?.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const s = status.toUpperCase();

    if (s === "ACTIVE") { bg = "#EFF6FF"; color = "#2563EB"; }
    else if (s === "COMPLETED") { bg = "#F0FDF4"; color = "#16A34A"; }
    else if (s === "PAUSED") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (s === "PLANNING") { bg = "#F5F3FF"; color = "#7C3AED"; }
    else if (s === "CANCELLED") { bg = "#FEF2F2"; color = "#EF4444"; }

    return (
      <span style={{ background: bg, color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    let bg = "#F1F5F9";
    let color = "#64748B";
    const p = priority.toUpperCase();

    if (p === "HIGH") { bg = "#FFF7ED"; color = "#EA580C"; }
    else if (p === "URGENT") { bg = "#FEF2F2"; color = "#EF4444"; }
    else if (p === "LOW") { bg = "#F0FDF4"; color = "#16A34A"; }

    return (
      <span style={{ background: bg, color, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap", textTransform: "capitalize" }}>
        {priority.toLowerCase()}
      </span>
    );
  };

  return (
    <div className={styles.container} style={{ padding: "32px", maxWidth: "1500px", margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      
      {/* Top Title Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>Digital PR Dashboard</h1>
          <p className={styles.subtitle} style={{ margin: "4px 0 0 0" }}>Manage journalist pitch outreach, target media lists, and track coverage links.</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{ padding: "8px 16px", background: "#0D9488", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} />
          Create Campaign
        </button>
      </div>

      {/* Overview Cards Deck */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          
          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Active Campaigns</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>{overview.activeCampaigns}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>Out of {overview.totalCampaigns} total campaigns</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Outreach Targets</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>{overview.totalOutreach}</div>
            <div style={{ fontSize: "11px", color: "#16A34A", marginTop: "4px" }}>{overview.contactedCount} contacted sent</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Response Rate</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>{overview.responseRate.toFixed(1)}%</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>{overview.responsesCount} responses logged</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Coverage Placements</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", marginTop: "4px" }}>{overview.publishedPlacements}</div>
            <div style={{ fontSize: "11px", color: "#0D9488", marginTop: "4px" }}>{overview.placementRate.toFixed(1)}% placement rate</div>
          </div>

          <div style={{ background: "white", padding: "16px 20px", borderRadius: "8px", border: "1px solid #E2E8F0", borderLeft: "4px solid #EF4444" }}>
            <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Overdue Follow-ups</span>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#EF4444", marginTop: "4px" }}>{overview.overdueFollowUps}</div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>{overview.upcomingFollowUps} upcoming / due today</div>
          </div>

        </div>
      )}

      {/* Filter and search controls */}
      <div style={{ background: "white", padding: "16px 24px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
          <Search size={16} style={{ color: "#94A3B8" }} />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontSize: "13px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Client:</span>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white", minWidth: "150px" }}>
            <option value="All">All Clients</option>
            {clientsList.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white" }}>
            <option value="All">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#64748B" }}>Priority:</span>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", background: "white" }}>
            <option value="All">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <button onClick={() => { setSearch(""); setClientFilter("All"); setStatusFilter("All"); setPriorityFilter("All"); }} style={{ padding: "6px 16px", background: "white", color: "#0F172A", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Clear</button>
      </div>

      {/* Campaigns Grid Ledger */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px", background: "white", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <div className="spinner" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className={styles.emptyState} style={{ background: "white", padding: "60px", textAlign: "center" }}>
          <Megaphone className={styles.emptyIcon} style={{ fontSize: "48px", color: "#94A3B8", marginBottom: "16px" }} />
          <h2 className={styles.emptyTitle} style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>No PR Campaigns found</h2>
          <p className={styles.emptyDesc} style={{ color: "#64748B", margin: "8px 0 16px 0" }}>Start a brand mention or PR outreach campaign for a client.</p>
          <button onClick={openCreateModal} className={styles.btnPrimary} style={{ margin: "0 auto" }}>
            <Plus size={14} style={{ marginRight: "4px" }} />
            Create Campaign
          </button>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", color: "#64748B", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Campaign Name</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Client</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Priority</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Start Date</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Outreach</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Placements</th>
                <th style={{ padding: "14px 24px", fontWeight: "600" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr 
                  key={camp.id} 
                  style={{ borderTop: "1px solid #F1F5F9", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                  <td style={{ padding: "16px 24px", color: "#0F172A", fontWeight: "600" }}>
                    <Link href={`/admin/pr/${camp.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {camp.campaignName}
                    </Link>
                  </td>
                  <td style={{ padding: "16px 24px", color: "#475569" }}>{camp.client?.name}</td>
                  <td style={{ padding: "16px 24px" }}>{getStatusBadge(camp.status)}</td>
                  <td style={{ padding: "16px 24px" }}>{getPriorityBadge(camp.priority)}</td>
                  <td style={{ padding: "16px 24px", color: "#64748B" }}>
                    {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "16px 24px", color: "#475569", fontWeight: "600" }}>{camp._count.outreachRecords}</td>
                  <td style={{ padding: "16px 24px", color: "#0D9488", fontWeight: "600" }}>{camp._count.placements}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <Link href={`/admin/pr/${camp.id}`} style={{ color: "#0D9488", fontWeight: "600", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      Manage
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className={modalStyles.overlay} onClick={() => setIsModalOpen(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className={modalStyles.header}>
              <span className={modalStyles.title}>Create Digital PR Campaign</span>
              <button onClick={() => setIsModalOpen(false)} className={modalStyles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className={modalStyles.body}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", color: "var(--error)", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem" }}>
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Campaign Name</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Q4 FinTech Product Launch Outreach"
                  required
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Target Client</label>
                <select
                  className={modalStyles.input}
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clientsList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Objective / Target Goals</label>
                <input
                  type="text"
                  className={modalStyles.input}
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="e.g. Secure 5 high-authority backlinks on business sites"
                />
              </div>

              <div className={modalStyles.formGroup} style={{ marginBottom: "16px" }}>
                <label className={modalStyles.label}>Description</label>
                <textarea
                  className={modalStyles.input}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Add campaign details, angles, pitch notes..."
                  style={{ minHeight: "60px", resize: "vertical", padding: "8px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Status</label>
                  <select
                    className={modalStyles.input}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Priority</label>
                  <select
                    className={modalStyles.input}
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Start Date</label>
                  <input
                    type="date"
                    className={modalStyles.input}
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>

                <div className={modalStyles.formGroup} style={{ flex: 1 }}>
                  <label className={modalStyles.label}>Budget (USD)</label>
                  <input
                    type="number"
                    className={modalStyles.input}
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>
            </form>
            <div className={modalStyles.footer} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setIsModalOpen(false)} className={`${modalStyles.btn} ${modalStyles.btnCancel}`} disabled={isSaving}>
                Cancel
              </button>
              <button onClick={handleCreateCampaign} className={`${modalStyles.btn} ${modalStyles.btnSave}`} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
